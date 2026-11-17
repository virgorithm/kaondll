from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('orders', '0007_canteenhours')]

    operations = [migrations.AddField(
        model_name='order',
        name='customer_note',
        field=models.TextField(blank=True, max_length=500),
    )]
