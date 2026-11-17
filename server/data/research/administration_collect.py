"""Bounded, polite extraction of public PUST professional office directory cards.

Only sanitized professional data is saved. Personal contact fields are discarded.
"""
import json
import re
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = 'https://pust.ac.bd/'
INDEX = urljoin(BASE, 'administration/All-Office')
CHECKED = '2026-11-17'
DEST = Path(__file__).with_name('administration.json')
SESSION = requests.Session()
SESSION.headers['User-Agent'] = 'PUST-Guide-public-directory-review/1.0'


def clean(value):
    return ' '.join(value.split())


def fetch(url):
    time.sleep(0.7)
    response = SESSION.get(url, timeout=45)
    response.raise_for_status()
    return response.url, BeautifulSoup(response.text, 'html.parser')


def parse_person(card, url):
    heading = card.select_one('h4')
    if not heading:
        return None
    name = clean(' '.join(str(x) for x in heading.find_all(string=True, recursive=False)))
    designation = clean(' '.join(x.get_text(' ', strip=True) for x in heading.select('span')))
    emails = []
    phones = []
    for paragraph in card.select('.social p'):
        value = clean(paragraph.get_text(' ', strip=True))
        if '(Personal)' in value:
            continue
        emails.extend(re.findall(r'[A-Z0-9._%+-]+@pust\.ac\.bd', value, flags=re.I))
        if '(Office)' in value and '@' not in value:
            phone = value.replace('(Office)', '').strip()
            if re.search(r'\d', phone):
                phones.append(phone)
    emails = list(dict.fromkeys(emails))
    phones = list(dict.fromkeys(phones))
    leadership = False
    # Section headings such as Director/Administrators and Contact Information
    # precede some named heads; only explicit secondary/staff sections end it.
    parent = card.find_parent('div', class_='panel-body')
    if parent:
        previous_headers = [h for h in card.find_all_previous('h2') if h.find_parent('div', class_='panel-body') == parent]
        secondary = ('officers', 'additional director', 'assistant provost', 'deputy director')
        leadership = not any(clean(h.get_text(' ', strip=True)).lower() in secondary for h in previous_headers)
    result = {
        'name': name,
        'designation': designation,
        'email': emails[0] if emails else '',
        'office_phone': phones[0] if phones else '',
        'additional_emails': emails[1:],
        'additional_office_phones': phones[1:],
        'is_head': leadership,
        'source_url': url,
        'checked_at': CHECKED,
    }
    return result


def main():
    index_url, soup = fetch(INDEX)
    inventory = []
    for link in soup.select('a'):
        if link.select_one('h4.panel-title'):
            inventory.append((clean(link.get_text(' ', strip=True)), urljoin(index_url, link['href'])))
    result = {
        'checked_at': CHECKED,
        'source_urls': [index_url],
        'offices': [],
        'coverage': {'inventory_office_count': len(inventory), 'attempted_office_count': 0},
        'notes': [
            'Official listings were observed on the checked date; publication does not guarantee appointments are current.',
            'Only professional names, designations, pust.ac.bd emails and explicitly Office-labeled phones are retained. Personal emails and Personal-labeled phones are omitted.',
            'Office locations and descriptions are blank unless an official office source explicitly states them. The shared website footer is not treated as an individual office contact.',
            'The All-Office index embeds Vice-Chancellor cards below its inventory; individual office pages are the canonical sources for office personnel.',
        ],
    }
    for index, (name, url) in enumerate(inventory):
        record = {
            'id': url.rsplit('/', 1)[-1].lower(), 'name': name,
            'source_url': url, 'checked_at': CHECKED,
            'office_email': '', 'office_phone': '', 'description': '', 'location': '',
            'people': [], 'unfilled_roles': [], 'notes': [],
        }
        try:
            canonical, page = fetch(url)
            record['source_url'] = canonical
            for card in page.select('.to_profile'):
                person = parse_person(card, canonical)
                if not person:
                    continue
                if not re.search(r'[A-Za-z\u0980-\u09ff]', person['name']) or person['name'].lower() in ['vacant', 'n/a']:
                    role = dict(person)
                    role['name'] = ''
                    record['unfilled_roles'].append(role)
                else:
                    record['people'].append(person)
            if len([p for p in record['people'] if p['is_head']]) > 1:
                primary_titles = {'vice chancellor', 'pro vice chancellor', 'treasurer', 'registrar', 'proctor', 'director', 'administrator', 'provost'}
                explicit = [p for p in record['people'] if p['designation'].lower() in primary_titles]
                for person in record['people']:
                    person['is_head'] = len(explicit) == 1 and person is explicit[0]
                if len(explicit) != 1:
                    record['notes'].append('Multiple top-level cards are published without an explicit head label; head flags are left false rather than inferring seniority.')
            heads = [p for p in record['people'] if p['is_head']]
            if heads:
                record['office_email'] = heads[0]['email']
                record['office_phone'] = heads[0]['office_phone']
            record['contact_source_url'] = canonical
            for panel in page.select('.panel-body'):
                for card in panel.select('.to_profile'):
                    card.decompose()
                text = clean(panel.get_text(' ', strip=True))
                email = re.search(r'Email:\s*([A-Z0-9._%+-]+@pust\.ac\.bd)', text, re.I)
                phone = re.search(r'Phone:\s*([+()0-9][+()0-9 -]*[0-9])', text, re.I)
                if email:
                    record['office_email'] = email.group(1)
                if phone:
                    record['office_phone'] = phone.group(1).strip()
            if record['id'] == 'registrar-office':
                record['office_email'] = 'registraroffice@pust.ac.bd'
                record['office_phone'] = '+8802588845193'
                record['notes'].append('The shared Contact Us footer explicitly identifies the Registrar and supplies registraroffice@pust.ac.bd / +8802588845193; the individual Registrar card separately lists registrar@pust.ac.bd.')
            if record['id'] == 'establishment-and-council-section':
                record['notes'].append('The source displays a first leadership card titled Director (Accounts), also listed in Finance and Accounts. Both office-role observations are retained as published; no transfer date or replacement is inferred.')
            if not record['people']:
                record['notes'].append('No named staff cards were published in the office page content at review time.')
            if record['unfilled_roles']:
                record['notes'].append('The source publishes one or more role cards with blank or placeholder names; no appointment is inferred.')
            record['status'] = 'reviewed'
        except Exception as error:
            record['status'] = 'fetch_failed'
            record['notes'].append(type(error).__name__ + ': ' + str(error))
        result['offices'].append(record)
        result['coverage']['attempted_office_count'] = index + 1
        result['coverage']['named_office_role_count'] = sum(len(x['people']) for x in result['offices'])
        result['coverage']['unfilled_role_count'] = sum(len(x['unfilled_roles']) for x in result['offices'])
        result['coverage']['failed_offices'] = [x['source_url'] for x in result['offices'] if x['status'] == 'fetch_failed']
        DEST.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f"{index + 1}/{len(inventory)} {name}: {len(record['people'])} named, {len(record['unfilled_roles'])} placeholders; {record['status']}", flush=True)


if __name__ == '__main__':
    main()
