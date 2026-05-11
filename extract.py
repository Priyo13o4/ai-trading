from bs4 import BeautifulSoup
import sys

with open(sys.argv[1], 'r') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

for style in soup('style'):
    style.extract()

# Remove Termly branding
for a in soup.find_all('a'):
    if 'termly' in a.get('href', ''):
        a.extract()

print(soup.get_text('\n', strip=True))
