# Generated by Django 5.0.6 on 2024-10-23 05:55

import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='License',
            fields=[
                ('license_id', models.CharField(max_length=10, primary_key=True, serialize=False)),
                ('organisation', models.CharField(default='IAF', max_length=5, null=True)),
                ('allocated_to', models.CharField(blank=True, max_length=150, null=True)),
                ('status', models.CharField(default=0, max_length=2)),
                ('is_reserved', models.IntegerField(blank=True, default=0)),
                ('valid_from', models.DateTimeField(null=True)),
                ('valid_till', models.DateTimeField(null=True)),
                ('created_timestamp', models.DateTimeField(default=django.utils.timezone.now)),
                ('hashed_license_id', models.CharField(editable=False, max_length=64, null=True)),
            ],
            options={
                'db_table': 'license_masters',
            },
        ),
        migrations.CreateModel(
            name='RoughDomain',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ip', models.CharField(max_length=45)),
                ('prototype', models.CharField(max_length=20)),
            ],
            options={
                'db_table': 'rough_domain',
            },
        ),
        migrations.CreateModel(
            name='RoughMail',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mailid', models.EmailField(max_length=254)),
            ],
            options={
                'db_table': 'rough_mail',
            },
        ),
        migrations.CreateModel(
            name='RoughURL',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('url', models.CharField(max_length=255)),
                ('protocol', models.CharField(max_length=20)),
            ],
            options={
                'db_table': 'rough_url',
            },
        ),
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('email', models.EmailField(max_length=200, unique=True)),
                ('is_deleted', models.BooleanField(default=False)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
            },
        ),
        migrations.CreateModel(
            name='Organisations',
            fields=[
                ('organisation', models.IntegerField(primary_key=True, serialize=False)),
                ('organisation_name', models.CharField(max_length=255)),
                ('organisation_created_at', models.DateTimeField(auto_now_add=True)),
                ('organisation_updated_at', models.DateTimeField(auto_now=True)),
                ('organisation_is_active', models.BooleanField(default=True)),
                ('organisation_is_deleted', models.BooleanField(default=False)),
                ('organisation_updated_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='updated_by', to=settings.AUTH_USER_MODEL)),
                ('organsation_created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'organisation_masters',
            },
        ),
        migrations.CreateModel(
            name='PluginMaster',
            fields=[
                ('plugin_id', models.CharField(max_length=35, primary_key=True, serialize=False)),
                ('browser', models.CharField(max_length=15)),
                ('ip_add', models.GenericIPAddressField()),
                ('install_date', models.DateTimeField()),
                ('create_timestamp', models.DateTimeField(auto_now_add=True)),
                ('last_updated_timestamp', models.DateTimeField(auto_now=True)),
                ('license_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plugins', to='users.license')),
            ],
            options={
                'db_table': 'plugin_masters',
            },
        ),
        migrations.AddField(
            model_name='license',
            name='plugin_id',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='licenses', to='users.pluginmaster'),
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone_number', models.CharField(max_length=10)),
                ('address', models.TextField(max_length=500)),
                ('organization', models.CharField(max_length=255)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='LicenseAllocation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('allocated_to', models.CharField(max_length=50)),
                ('allocation_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('revoke_date', models.DateTimeField(blank=True, null=True)),
                ('license', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.license')),
                ('plugin', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='users.pluginmaster')),
            ],
            options={
                'db_table': 'license_allocations',
                'unique_together': {('license', 'allocation_date')},
            },
        ),
    ]
