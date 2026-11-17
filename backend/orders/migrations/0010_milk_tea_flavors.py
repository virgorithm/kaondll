from decimal import Decimal
from django.db import migrations


def update_milk_tea_menu(apps, schema_editor):
    MenuItem = apps.get_model('orders', 'MenuItem')
    flavors = [
        ('Wintermelon Milk Tea', 'Creamy wintermelon tea with pearls', '55.00'),
        ('Okinawa Milk Tea', 'Brown sugar milk tea with pearls', '60.00'),
        ('Classic Milk Tea', 'Smooth black milk tea with pearls', '50.00'),
        ('Taro Milk Tea', 'Creamy taro with chewy pearls', '55.00'),
        ('Matcha Milk Tea', 'Earthy green tea with milk and pearls', '60.00'),
        ('Chocolate Milk Tea', 'Rich chocolate milk tea with pearls', '55.00'),
        ('Strawberry Milk Tea', 'Sweet strawberry milk tea with pearls', '55.00'),
        ('Hokkaido Milk Tea', 'Roasted, creamy milk tea with pearls', '60.00'),
        ('Caramel Milk Tea', 'Sweet caramel milk tea with pearls', '55.00'),
        ('Cookies & Cream Milk Tea', 'Creamy tea with crushed cookies', '60.00'),
        ('Mango Milk Tea', 'Fruity mango milk tea with pearls', '55.00'),
        ('Brown Sugar Milk Tea', 'Caramelized brown sugar with milk and pearls', '60.00'),
        ('Ube Milk Tea', 'Creamy ube milk tea with chewy pearls', '55.00'),
    ]
    for name, description, price in flavors:
        item, created = MenuItem.objects.get_or_create(name=name, defaults={
            'description': description, 'price': Decimal(price), 'category': 'Milk Tea',
            'emoji': '\U0001F9CB', 'color': 'lavender', 'available': True,
        })
        if not created:
            item.description = description
            item.price = Decimal(price)
            item.category = 'Milk Tea'
            item.save(update_fields=['description', 'price', 'category'])


class Migration(migrations.Migration):
    dependencies = [('orders', '0009_addons_milk_tea')]
    operations = [migrations.RunPython(update_milk_tea_menu, migrations.RunPython.noop)]
