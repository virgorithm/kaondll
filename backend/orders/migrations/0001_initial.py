from django.db import migrations, models
import django.db.models.deletion


def add_sample_menu(apps, schema_editor):
    MenuItem = apps.get_model('orders', 'MenuItem')
    entries = [
        ('Chicken Inasal', 'Grilled chicken, garlic rice, atchara', '95.00', 'Meals', '🍗', 'peach', True),
        ('Pork Sisig Bowl', 'Sizzling sisig with egg and rice', '89.00', 'Meals', '🍳', 'yellow', True),
        ('Sinigang na Baboy', 'Tamarind broth, pork, fresh veg', '85.00', 'Meals', '🍲', 'green', False),
        ('Pancit Canton', 'Wok-tossed noodles, veggies, calamansi', '65.00', 'Snacks', '🍜', 'pink', False),
        ('Turon', 'Crispy banana roll with langka', '20.00', 'Snacks', '🍌', 'yellow', False),
        ('Iced Calamansi', 'Fresh-squeezed, lightly sweetened', '25.00', 'Drinks', '🍋', 'green', False),
        ('Ube Milk Tea', 'Creamy ube with chewy pearls', '55.00', 'Drinks', '🧋', 'lavender', False),
        ('Pandesal Duo', 'Warm, soft pandesal (2 pcs)', '18.00', 'Snacks', '🥖', 'peach', False),
    ]
    for name, description, price, category, emoji, color, popular in entries:
        MenuItem.objects.get_or_create(name=name, defaults={'description': description, 'price': price, 'category': category, 'emoji': emoji, 'color': color, 'popular': popular})


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='MenuItem',
            fields=[('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')), ('name', models.CharField(max_length=120)), ('description', models.CharField(blank=True, max_length=240)), ('price', models.DecimalField(decimal_places=2, max_digits=7)), ('category', models.CharField(choices=[('Meals', 'Meals'), ('Snacks', 'Snacks'), ('Drinks', 'Drinks')], default='Meals', max_length=20)), ('emoji', models.CharField(default='🍽️', max_length=12)), ('color', models.CharField(default='peach', max_length=20)), ('available', models.BooleanField(default=True)), ('popular', models.BooleanField(default=False))],
        ),
        migrations.CreateModel(
            name='Order',
            fields=[('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')), ('pickup_time', models.CharField(default='ASAP · about 15 min', max_length=80)), ('status', models.CharField(choices=[('received', 'Received'), ('preparing', 'Preparing'), ('ready', 'Ready'), ('collected', 'Collected')], default='received', max_length=20)), ('total', models.DecimalField(decimal_places=2, default=0, max_digits=8)), ('created_at', models.DateTimeField(auto_now_add=True))],
        ),
        migrations.CreateModel(
            name='OrderLine',
            fields=[('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')), ('quantity', models.PositiveIntegerField()), ('unit_price', models.DecimalField(decimal_places=2, max_digits=7)), ('menu_item', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='orders.menuitem')), ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='orders.order'))],
        ),
        migrations.RunPython(add_sample_menu, migrations.RunPython.noop),
    ]
