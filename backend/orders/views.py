from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.utils import timezone
from .models import CanteenHours, MenuItem, Order, OrderReview, ReviewReply
from .serializers import CanteenHoursSerializer, LoginSerializer, MenuItemSerializer, OrderInputSerializer, OrderReviewSerializer, OrderSerializer, RegisterSerializer

def canteen_hours_payload(hours):
    now = timezone.localtime().time().replace(tzinfo=None)
    opening, closing = hours.open_time, hours.close_time
    is_open = opening <= now < closing if opening < closing else (now >= opening or now < closing if opening > closing else False)
    return {**CanteenHoursSerializer(hours).data, 'is_open': is_open}

class PublicCanteenHours(APIView):
    def get(self, request):
        return Response(canteen_hours_payload(CanteenHours.get_solo()))

class AdminCanteenHours(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(canteen_hours_payload(CanteenHours.get_solo()))

    def patch(self, request):
        hours = CanteenHours.get_solo()
        serializer = CanteenHoursSerializer(hours, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(canteen_hours_payload(hours))

class AdminReviewReply(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        from django.shortcuts import get_object_or_404
        review = get_object_or_404(OrderReview, pk=pk)
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'detail': 'Write a reply before sending.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(message) > 1000:
            return Response({'detail': 'Replies must be 1000 characters or less.'}, status=status.HTTP_400_BAD_REQUEST)
        reply, _ = ReviewReply.objects.update_or_create(review=review, defaults={'user': request.user, 'message': message})
        review.refresh_from_db()
        return Response(OrderReviewSerializer(review, context={'request': request}).data)

class OrderReviewListCreate(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderReviewSerializer
    queryset = OrderReview.objects.select_related('user', 'order', 'reply', 'reply__user').order_by('-created_at')

class MenuList(generics.ListAPIView):
    serializer_class = MenuItemSerializer
    queryset = MenuItem.objects.filter(available=True).order_by('category', 'name')

class AdminMenuList(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        items = MenuItem.objects.all().order_by('category', 'name')
        return Response(MenuItemSerializer(items, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = MenuItemSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AdminMenuDetail(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(MenuItem, pk=pk)

    def patch(self, request, pk):
        serializer = MenuItemSerializer(self.get_object(pk), data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class AdminOrderList(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = Order.objects.select_related('user').prefetch_related('items__menu_item').order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)

class AdminOrderDetail(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        from django.shortcuts import get_object_or_404
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS):
            return Response({'detail': 'Choose a valid order status.'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        update_fields = ['status']
        if new_status == 'preparing' and order.preparation_started_at is None:
            order.preparation_started_at = timezone.now()
            update_fields.append('preparation_started_at')
            duration = request.data.get('preparation_duration_minutes', 15)
            try:
                duration = int(duration)
            except (TypeError, ValueError):
                return Response({'detail': 'Timer must be between 5 and 120 minutes.'}, status=status.HTTP_400_BAD_REQUEST)
            if not 5 <= duration <= 120:
                return Response({'detail': 'Timer must be between 5 and 120 minutes.'}, status=status.HTTP_400_BAD_REQUEST)
            order.preparation_duration_minutes = duration
            update_fields.append('preparation_duration_minutes')
        order.save(update_fields=update_fields)
        return Response(OrderSerializer(order).data)

class OrderCreate(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = request.user.canteen_orders.prefetch_related('items__menu_item').order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        hours = CanteenHours.get_solo()
        if not canteen_hours_payload(hours)['is_open']:
            return Response({'detail': 'The canteen is currently closed. Please place your order during opening hours.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OrderInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(user=request.user)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class Register(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            detail = next(iter(serializer.errors.values()))[0]
            return Response({'detail': str(detail)}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'username': user.username, 'is_staff': user.is_staff}, status=status.HTTP_201_CREATED)

class Login(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            detail = serializer.errors.get('detail')
            if isinstance(detail, (list, tuple)):
                detail = detail[0]
            if detail is None:
                detail = next(iter(serializer.errors.values()))[0]
            return Response({'detail': str(detail)}, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'username': user.username, 'is_staff': user.is_staff})

class CurrentUser(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'username': request.user.username, 'is_staff': request.user.is_staff})

    def patch(self, request):
        username = request.data.get('username', '')
        if not isinstance(username, str):
            return Response({'detail': 'Enter a valid account name.'}, status=status.HTTP_400_BAD_REQUEST)
        username = username.strip()
        if len(username) < 3 or len(username) > 150:
            return Response({'detail': 'Account name must be between 3 and 150 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(username__iexact=username).exclude(pk=request.user.pk).exists():
            return Response({'detail': 'That account name is already taken.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.username = username
        request.user.save(update_fields=['username'])
        return Response({'username': request.user.username, 'is_staff': request.user.is_staff})
