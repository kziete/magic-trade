import datetime

import django.utils.timezone
from django.db import migrations, models


def _one_day_ago():
    # Backfill default for existing rows. Deliberately NOT timezone.now() --
    # cards.tasks.check_new_wishlist_matches notifies wishlists about
    # Available rows created in the last hour, so backfilling with "now"
    # would make every pre-existing listing look brand new on deploy day and
    # blast every matching wishlist with a false "just registered" email.
    return django.utils.timezone.now() - datetime.timedelta(days=1)


class Migration(migrations.Migration):

    dependencies = [
        ('cards', '0016_wanted_quantity'),
    ]

    operations = [
        migrations.AddField(
            model_name='available',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=_one_day_ago),
            preserve_default=False,
        ),
    ]
