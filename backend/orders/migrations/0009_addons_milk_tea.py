from decimal import Decimal
from django.db import migrations, models


def add_drinks(apps, schema_editor):
    MenuItem = apps.get_model('orders', 'MenuItem')
    products = [
        ('Orange Juice', 'Chilled orange juice', '35.00', 'Drinks', '\U0001F9C3', 'peach'),
        ('Apple Juice', 'Chilled apple juice', '35.00', 'Drinks', '\U0001F9C3', 'green'),
        ('Bottled Water', 'Cold bottled water', '15.00', 'Drinks', '\U0001F4A7', 'green'),
        ('Cola Soda', 'Chilled cola', '25.00', 'Drinks', '\U0001F964', 'peach'),
        ('Lemon-Lime Soda', 'Chilled lemon-lime soda', '25.00', 'Drinks', '\U0001F964', 'green'),
        ('Classic Milk Tea', 'Black tea with milk and pearls', '55.00', 'Milk Tea', '\U0001F9CB', 'lavender'),
        ('Taro Milk Tea', 'Creamy taro milk tea with pearls', '60.00', 'Milk Tea', '\U0001F9CB', 'lavender'),
        ('Wintermelon Milk Tea', 'Wintermelon milk tea with pearls', '60.00', 'Milk Tea', '\U0001F9CB', 'peach'),
    ]
    MenuItem.objects.filter(name__icontains='milk tea').update(category='Milk Tea')
    for name, description, price, category, emoji, color in products:
        MenuItem.objects.get_or_create(name=name, defaults={'description': description, 'price': Decimal(price), 'category': category, 'emoji': emoji, 'color': color, 'available': True})

class Migration(migrations.Migration):
    dependencies = [('orders', '0008_order_customer_note')]
    operations = [
        migrations.AddField(model_name='order', name='add_ons', field=models.JSONField(blank=True, default=list)),
        migrations.AlterField(model_name='menuitem', name='category', field=models.CharField(choices=[('Meals', 'Meals'), ('Snacks', 'Snacks'), ('Drinks', 'Drinks'), ('Milk Tea', 'Milk Tea')], default='Meals', max_length=20)),
        migrations.RunPython(add_drinks, migrations.RunPython.noop),
    ]
