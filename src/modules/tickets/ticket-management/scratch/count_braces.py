
import sys

with open('/Users/francoalvaradotello/QdoorAChile/support-portal/src/modules/tickets/ticket-management/ticket-management.component.ts', 'r') as f:
    content = f.read()

# Extract template part
start_marker = 'template: `'
end_marker = '`, '
start_idx = content.find(start_marker)
if start_idx != -1:
    start_idx += len(start_marker)
    end_idx = content.find(end_marker, start_idx)
    template = content[start_idx:end_idx]
    
    print(f"Template length: {len(template)}")
    
    # Simple brace counter
    open_count = 0
    close_count = 0
    for i, char in enumerate(template):
        if char == '{':
            # Check if it's double brace {{
            if i + 1 < len(template) and template[i+1] == '{':
                # Skip interpolation
                pass
            elif i > 0 and template[i-1] == '{':
                # Skip interpolation
                pass
            else:
                open_count += 1
                # print(f"Open at char {i}")
        elif char == '}':
            # Check if it's double brace }}
            if i + 1 < len(template) and template[i+1] == '}':
                # Skip interpolation
                pass
            elif i > 0 and template[i-1] == '}':
                # Skip interpolation
                pass
            else:
                close_count += 1
                # print(f"Close at char {i}")
                
    print(f"Braces: Open={open_count}, Close={close_count}")
else:
    print("Template not found")
