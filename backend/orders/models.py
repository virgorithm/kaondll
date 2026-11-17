from django.conf import settings
from django.db import models
from datetime import time as datetime_time

class CanteenHours(models.Model):
    open_time = models.TimeField(default=datetime_time(8, 0))
    close_time = models.TimeField(default=datetime_time(16, 0))
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_solo(cls):
        hours, _ = cls.objects.get_or_create(pk=1)
        return hours

    def __str__(self):
        return f'Canteen hours: {self.open_time:%H:%M}–{self.close_time:%H:%M}'

class MenuItem(models.Model):
    CATEGORIES = [('Meals', 'Meals'), ('Snacks', 'Snacks'), ('Drinks', 'Drinks'), ('Milk Tea', 'Milk Tea')]
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=240, blank=True)
    price = models.DecimalField(max_digits=7, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='Meals')
    emoji = models.CharField(max_length=12, default='🍽️')
    color = models.CharField(max_length=20, default='peach')
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    available = models.BooleanField(default=True)
    popular = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Order(models.Model):
    STATUS = [('received', 'Received'), ('preparing', 'Preparing'), ('ready', 'Ready'), ('collected', 'Collected')]
    pickup_time = models.CharField(max_length=80, default='ASAP · about 15 min')
    customer_note = models.TextField(max_length=500, blank=True)
    add_ons = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='received')
    total = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    preparation_started_at = models.DateTimeField(null=True, blank=True)
    preparation_duration_minutes = models.PositiveSmallIntegerField(default=15)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='canteen_orders', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f'Order #{self.pk} — {self.get_status_display()}'

class OrderLine(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=7, decimal_places=2)

class OrderReview(models.Model):
    order = models.OneToOneField(Order, related_name='review', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='canteen_reviews', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Review for order #{self.order_id} ({self.rating}/5)'

class ReviewReply(models.Model):
    review = models.OneToOneField(OrderReview, related_name='reply', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='review_replies', on_delete=models.PROTECT)
    message = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Admin reply to review #{self.review_id}'
