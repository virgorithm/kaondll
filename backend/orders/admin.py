from django.contrib import admin
from .models import MenuItem, Order, OrderLine

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'available', 'popular')
    list_filter = ('category', 'available')
    search_fields = ('name',)

class OrderLineInline(admin.TabularInline):
    model = OrderLine
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'pickup_time', 'total', 'created_at')
    list_filter = ('status', 'created_at')
    inlines = [OrderLineInline]
