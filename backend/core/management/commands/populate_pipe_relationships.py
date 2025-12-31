# core/management/commands/populate_pipe_relationships.py
from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from core.models import (  # Make sure this matches your app name
    HoleSection, CasingSize, DrillpipeSize, 
    MinimumIdSize, HoleSectionRelationship
)

class Command(BaseCommand):
    help = 'Populate initial pipe size relationships'
    
    def handle(self, *args, **kwargs):
        with transaction.atomic():
            # Create casing sizes
            casing_data = [
                {'size': Decimal('13.375'), 'display_name': '13 3/8"'},
                {'size': Decimal('9.625'), 'display_name': '9 5/8"'},
                {'size': Decimal('7.0'), 'display_name': '7"'},
            ]
            
            for data in casing_data:
                CasingSize.objects.get_or_create(**data)
                self.stdout.write(f"Created/ensured casing size: {data['display_name']}")
            
            # Create drillpipe sizes
            drillpipe_data = [
                {'size': Decimal('5.0'), 'display_name': '5"'},
                {'size': Decimal('4.5'), 'display_name': '4 1/2"'},
            ]
            
            for data in drillpipe_data:
                DrillpipeSize.objects.get_or_create(**data)
                self.stdout.write(f"Created/ensured drillpipe size: {data['display_name']}")
            
            # Create minimum ID sizes
            min_id_data = [
                {'size': Decimal('2.0'), 'display_name': '2"'},
                {'size': Decimal('2.25'), 'display_name': '2 1/4"'},
                # You might want to add more minimum ID sizes here
                {'size': Decimal('1.5'), 'display_name': '1 1/2"'},
                {'size': Decimal('1.0'), 'display_name': '1"'},
            ]
            
            for data in min_id_data:
                MinimumIdSize.objects.get_or_create(**data)
                self.stdout.write(f"Created/ensured minimum ID size: {data['display_name']}")
            
            # Define relationships based on your examples
            relationships = {
                '16': {
                    'casings': ['13.375', '9.625', '7.0'],
                    'drillpipes': ['5.0', '4.5']
                },
                '9 5/8': {
                    'casings': ['7.0'],
                    'drillpipes': ['5.0', '4.5']
                },
                '13 3/8': {
                    'casings': ['9.625', '7.0'],
                    'drillpipes': ['5.0', '4.5']
                },
                '7': {
                    'casings': [],  # No casing smaller than 7"
                    'drillpipes': ['5.0', '4.5']
                },
                '8 1/2': {
                    'casings': ['7.0'],
                    'drillpipes': ['5.0', '4.5']
                },
                '12 1/4': {
                    'casings': ['9.625', '7.0'],
                    'drillpipes': ['5.0', '4.5']
                },
                '4 1/2': {
                    'casings': [],
                    'drillpipes': []  # Might need smaller drillpipes
                },
                # Add more as needed
            }
            
            for hole_section_name, data in relationships.items():
                try:
                    hole_section = HoleSection.objects.get(name=hole_section_name)
                    rel, created = HoleSectionRelationship.objects.get_or_create(
                        hole_section=hole_section
                    )
                    
                    # Clear existing relationships
                    rel.allowed_casing_sizes.clear()
                    rel.allowed_drillpipe_sizes.clear()
                    
                    # Add casing sizes
                    for casing_size in data['casings']:
                        casing = CasingSize.objects.get(size=Decimal(casing_size))
                        rel.allowed_casing_sizes.add(casing)
                    
                    # Add drillpipe sizes
                    for drillpipe_size in data['drillpipes']:
                        drillpipe = DrillpipeSize.objects.get(size=Decimal(drillpipe_size))
                        rel.allowed_drillpipe_sizes.add(drillpipe)
                    
                    status_msg = "Created" if created else "Updated"
                    self.stdout.write(
                        self.style.SUCCESS(f'{status_msg} relationship for {hole_section_name}')
                    )
                    
                except HoleSection.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'Hole section {hole_section_name} not found')
                    )
                except CasingSize.DoesNotExist as e:
                    self.stdout.write(
                        self.style.ERROR(f'Casing size not found for {hole_section_name}: {e}')
                    )
                except DrillpipeSize.DoesNotExist as e:
                    self.stdout.write(
                        self.style.ERROR(f'Drillpipe size not found for {hole_section_name}: {e}')
                    )
        
        self.stdout.write(self.style.SUCCESS('Successfully populated pipe relationships!'))