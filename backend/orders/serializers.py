from rest_framework import serializers
from decimal import Decimal
from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.db.models import Q
from .models import CanteenHours, MenuItem, Order, OrderLine, OrderReview, ReviewReply

class CanteenHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = CanteenHours
        fields = ['open_time', 'close_time']

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'description', 'price', 'category', 'image', 'emoji', 'available', 'popular']

class OrderLineInputSerializer(serializers.Serializer):
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MenuItem.objects.filter(available=True))
    quantity = serializers.IntegerField(min_value=1, max_value=99)

ADD_ON_CHOICES = {
    'extra_rice': ('Extra rice', Decimal('15.00')),
    'fries_cheese': ('Cheese powder', Decimal('10.00')),
    'fries_bbq': ('BBQ powder', Decimal('10.00')),
    'fries_sour_cream': ('Sour cream powder', Decimal('10.00')),
}

class AddOnInputSerializer(serializers.Serializer):
    id = serializers.ChoiceField(choices=list(ADD_ON_CHOICES.keys()))
    menu_item = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=20)

class OrderInputSerializer(serializers.Serializer):
    pickup_time = serializers.CharField(max_length=80)
    customer_note = serializers.CharField(required=False, allow_blank=True, max_length=500, trim_whitespace=True)
    items = OrderLineInputSerializer(many=True, allow_empty=False, max_length=30)
    add_ons = AddOnInputSerializer(many=True, required=False, max_length=20)

    def validate_pickup_time(self, value):
        if value.startswith('ASAP'):
            return 'ASAP - about 15 min'
        if value in ('In 30 minutes', 'In 1 hour'):
            return value
        raise serializers.ValidationError('Choose a valid pickup time.')

    def validate_add_ons(self, add_ons):
        for entry in add_ons:
            item = MenuItem.objects.filter(pk=entry['menu_item'], available=True).first()
            if item is None:
                raise serializers.ValidationError('An add-on item is no longer available.')
            item_name = item.name.casefold()
            allowed = {'fries_cheese', 'fries_bbq', 'fries_sour_cream'} if 'fries' in item_name else ({'extra_rice'} if item.category == 'Meals' else set())
            if entry['id'] not in allowed:
                raise serializers.ValidationError(f"{entry['id']} is not an add-on for {item.name}.")
        return add_ons

    @transaction.atomic
    def create(self, validated_data):
        lines = validated_data.pop('items')
        add_on_inputs = validated_data.pop('add_ons', [])
        user = validated_data.pop('user')
        selected_add_ons = []
        for entry in add_on_inputs:
            name, price = ADD_ON_CHOICES[entry['id']]
            menu_item = MenuItem.objects.get(pk=entry['menu_item'])
            selected_add_ons.append({'menu_item': menu_item.pk, 'menu_item_name': menu_item.name, 'name': name, 'price': str(price), 'quantity': entry['quantity']})
        order = Order.objects.create(user=user, pickup_time=validated_data['pickup_time'], customer_note=validated_data.get('customer_note', ''), add_ons=selected_add_ons, total=Decimal('0.00'))
        total = Decimal('0.00')
        for line in lines:
            item, quantity = line['menu_item'], line['quantity']
            unit_price = item.price
            OrderLine.objects.create(order=order, menu_item=item, quantity=quantity, unit_price=unit_price)
            total += unit_price * quantity
        for add_on in selected_add_ons:
            total += Decimal(add_on['price']) * add_on['quantity']
        order.total = total
        order.save(update_fields=['total'])
        return order

class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    add_ons = serializers.JSONField(read_only=True)
    customer_username = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    def get_items(self, order):
        lines = getattr(order, '_prefetched_objects_cache', {}).get('items')
        if lines is None:
            lines = order.items.select_related('menu_item').all()
        return [{
            'menu_item': line.menu_item_id,
            'name': line.menu_item.name,
            'quantity': line.quantity,
            'unit_price': line.unit_price,
        } for line in lines]

    class Meta:
        model = Order
        fields = ['id', 'customer_username', 'pickup_time', 'status', 'total', 'created_at', 'preparation_started_at', 'preparation_duration_minutes', 'customer_note', 'add_ons', 'items']

class OrderReviewSerializer(serializers.ModelSerializer):
    order_number = serializers.IntegerField(source='order_id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    admin_reply = serializers.CharField(source='reply.message', read_only=True, allow_null=True)
    reply_username = serializers.CharField(source='reply.user.username', read_only=True, allow_null=True)
    reply_created_at = serializers.DateTimeField(source='reply.created_at', read_only=True, allow_null=True)

    class Meta:
        model = OrderReview
        fields = ['id', 'order', 'order_number', 'username', 'rating', 'comment', 'created_at', 'admin_reply', 'reply_username', 'reply_created_at']
        read_only_fields = ['id', 'order_number', 'username', 'created_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Choose a rating from 1 to 5 stars.')
        return value

    def validate_order(self, order):
        request = self.context['request']
        if order.user_id != request.user.id:
            raise serializers.ValidationError('You can only review your own order.')
        if order.status != 'collected':
            raise serializers.ValidationError('You can review an order after it has been collected.')
        if OrderReview.objects.filter(order=order).exists():
            raise serializers.ValidationError('This order already has a review.')
        return order

    def create(self, validated_data):
        return OrderReview.objects.create(user=self.context['request'].user, **validated_data)

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150, trim_whitespace=True)
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_username(self, value):
        username = value.strip()
        if get_user_model().objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError('This username is already taken.')
        return username

    def create(self, validated_data):
        return get_user_model().objects.create_user(username=validated_data['username'], password=validated_data['password'])

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(trim_whitespace=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        login = attrs['username'].strip()
        user_model = get_user_model()
        user = authenticate(username=login, password=attrs['password'])
        if user is None:
            candidate = user_model.objects.filter(username__iexact=login).first()
            if candidate:
                user = authenticate(username=candidate.username, password=attrs['password'])
        # Keep existing email-based accounts usable after switching the form to usernames.
        if user is None and '@' in login:
            candidate = user_model.objects.filter(email__iexact=login).first()
            if candidate:
                user = authenticate(username=candidate.username, password=attrs['password'])
        if user is None:
            raise serializers.ValidationError({'detail': 'Username or password is incorrect.'})
        attrs['user'] = user
        return attrs
