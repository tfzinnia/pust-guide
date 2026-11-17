"""Review linked facilities rosters and dean cards; retain source discrepancies."""
import json
import re
import sys
sys.dont_write_bytecode = True
from administration_collect import CHECKED, DEST, clean, fetch, parse_person


def normalized(value):
    return re.sub(r'[^a-z0-9]', '', value.lower())


def main():
    result = json.loads(DEST.read_text(encoding='utf-8'))
    offices = {office['id']: office for office in result['offices']}
    reviewed = []
    supplemental = [
        ('central-library-and-information-center', 'https://pust.ac.bd/facilities/library/library_officers'),
        ('medical-section', 'https://pust.ac.bd/facilities/medical/medical_officers'),
        ('transportation-pool', 'https://pust.ac.bd/facilities/transportation'),
        ('male-hall-1', 'https://pust.ac.bd/facilities/residence/O19'),
        ('female-hall--1', 'https://pust.ac.bd/facilities/residence/O20'),
        ('dormitory', 'https://pust.ac.bd/facilities/residence/dormitory'),
    ]
    for office_id, url in supplemental:
        office = offices[office_id]
        canonical, soup = fetch(url)
        reviewed.append(canonical)
        office.setdefault('additional_source_urls', []).append(canonical)
        added = []
        for card in soup.select('.to_profile'):
            person = parse_person(card, canonical)
            if not person or not person['name']:
                continue
            existing = next((p for p in office['people'] if normalized(p['name']) == normalized(person['name'])), None)
            if existing:
                existing.setdefault('additional_source_urls', []).append(canonical)
                if normalized(existing['designation']) != normalized(person['designation']):
                    office['notes'].append(f"The supplemental source {canonical} labels {person['name']} as {person['designation']}; the canonical office page labels this person {existing['designation']}. No appointment chronology is inferred.")
                for field in ['email', 'office_phone']:
                    if person[field] and not existing[field]:
                        existing[field] = person[field]
                        existing.setdefault('field_source_urls', {})[field] = canonical
                    elif person[field] and person[field] != existing[field]:
                        office['notes'].append(f"Alternate published {field} for {person['name']} at {canonical}: {person[field]}; the canonical office card value is retained.")
            else:
                person['is_head'] = False
                person['notes'] = ['Published on the linked facilities roster but absent from the administrative office roster at review time. No appointment chronology is inferred.']
                office['people'].append(person)
                added.append(person['name'])
        if added:
            office['notes'].append(f"The linked facilities roster {canonical} contains {len(added)} additional named professional role cards absent from the canonical administrative office page. Both source observations are retained; sources do not establish appointment dates.")
        print(f"Supplement {office['name']}: {len(added)} additional cards", flush=True)

    # Facilities context/contact blocks are separate from individual staff cards.
    for office_id, url, description in [
        ('central-library-and-information-center', 'https://pust.ac.bd/facilities/library', 'The university central library supports students, faculty, officers and researchers, including academic and research activities.'),
        ('medical-section', 'https://pust.ac.bd/facilities/medical', 'The university medical unit provides medical facilities for students, teachers and others.'),
    ]:
        canonical, soup = fetch(url)
        reviewed.append(canonical)
        office = offices[office_id]
        office['description'] = description
        office['description_source_url'] = canonical
        office.setdefault('additional_source_urls', []).append(canonical)
        if office_id == 'medical-section':
            text = clean(soup.get_text(' ', strip=True))
            assert 'medicalsection@pust.ac.bd' in text and '+8802588844975' in text
            office['office_email'] = 'medicalsection@pust.ac.bd'
            office['office_phone'] = '+8802588844975'
            office['contact_source_url'] = canonical

    canonical, soup = fetch('https://pust.ac.bd/facilities/residence')
    reviewed.append(canonical)
    for office_id in ['male-hall-1', 'female-hall--1', 'dormitory']:
        offices[office_id].setdefault('additional_source_urls', []).append(canonical)

    canonical, soup = fetch('https://pust.ac.bd/academic/all_dean')
    reviewed.append(canonical)
    dean_offices = []
    for card in soup.select('.to_profile'):
        heading = card.select_one('h5')
        if not heading:
            continue
        anchor = heading.select_one('a')
        name = clean(' '.join(str(x) for x in anchor.find_all(string=True, recursive=False)))
        role = anchor.select_one('span').get_text(' ', strip=True)
        faculty = heading.find_all('span', recursive=False)[-1].get_text(' ', strip=True)
        emails = []
        phones = []
        for paragraph in card.select('.social p'):
            value = clean(paragraph.get_text(' ', strip=True))
            if '(Personal)' in value:
                continue
            emails.extend(re.findall(r'[A-Z0-9._%+-]+@pust\.ac\.bd', value, re.I))
            if '(Office)' in value and '@' not in value:
                phones.append(value.replace('(Office)', '').strip())
        person = {
            'name': name, 'designation': role,
            'email': emails[0] if emails else '',
            'office_phone': phones[0] if phones else '',
            'additional_emails': emails[1:], 'additional_office_phones': phones[1:],
            'is_head': True, 'source_url': canonical, 'checked_at': CHECKED,
            'profile_url': anchor['href'],
        }
        dean_offices.append({
            'id': 'dean-' + re.sub(r'[^a-z0-9]+', '-', faculty.lower()).strip('-'),
            'name': 'Dean Office, ' + faculty, 'faculty': faculty,
            'source_url': canonical, 'checked_at': CHECKED,
            'office_email': person['email'], 'office_phone': person['office_phone'],
            'contact_source_url': canonical, 'description': '', 'location': '',
            'people': [person], 'unfilled_roles': [], 'notes': [], 'status': 'reviewed',
        })
    result['offices'].extend(dean_offices)
    result['source_urls'].extend(reviewed)
    result['coverage'].update({
        'dean_office_count': len(dean_offices),
        'total_office_count': len(result['offices']),
        'supplemental_source_count': len(reviewed),
        'named_office_role_count': sum(len(o['people']) for o in result['offices']),
        'named_head_count': sum(p['is_head'] for o in result['offices'] for p in o['people']),
        'roles_with_institutional_email': sum(bool(p['email']) for o in result['offices'] for p in o['people']),
        'offices_with_office_email': sum(bool(o['office_email']) for o in result['offices']),
        'offices_with_office_phone': sum(bool(o['office_phone']) for o in result['offices']),
        'unfilled_role_count': sum(len(o['unfilled_roles']) for o in result['offices']),
        'unique_name_count': len({normalized(p['name']) for o in result['offices'] for p in o['people']}),
        'reviewed_source_page_count': result['coverage']['inventory_office_count'] + 1 + len(reviewed),
    })
    result['notes'].extend([
        'Head flags follow explicit primary leadership titles or the single leading card block preceding secondary/staff sections. Multiple unlabelled top-level cards do not receive inferred head flags.',
        'Linked Male Hall 1 and Female Hall 1 facilities rosters publish additional assistant provosts absent from the administration pages. These supplemental source observations are included without assuming which roster is newer.',
        'The five dean office records come from the official All Dean listing; only dean role contacts are retained, with faculty profile URLs included for identity reference.',
        'Coverage is limited to all 33 All-Office entries, the All Dean directory, and linked library, medical, transport and residence roster/context pages. It does not assert completeness of staff who have no public directory entry.',
        'Office contacts prefer explicit Contact Information blocks; where absent, the published leading card contact is retained with its source. Ambiguous or missing contact values remain empty.',
    ])
    DEST.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result['coverage'], indent=2), flush=True)


if __name__ == '__main__':
    main()
