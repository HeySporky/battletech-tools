"""python -I -m unittest discover -s scripts/star-systems -p "test_*.py" """
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import import_mekhq_systems as imp  # noqa: E402

SYSTEM = {
    'id': 'Fixture', 'xcood': 1.5, 'ycood': -2.0, 'primarySlot': 2,
    'spectralType': {'source': 'canon', 'value': 'G2V'},
    'event': [{'date': '3000-01-01', 'nadirCharge': True}],
    'planet': [
        {'name': 'Outer', 'type': 'GAS_GIANT', 'sysPos': 1},
        {'name': {'source': 'canon', 'value': 'Home'}, 'type': 'TERRESTRIAL', 'sysPos': 2, 'gravity': 0.9,
         'event': [
             {'date': '2900-01-01', 'faction': {'source': 'canon', 'value': ['LA']}, 'population': 10},
             {'date': '2910-01-01', 'population': 11},
             {'date': '2950-01-01', 'population': 12},
             {'date': '3025-01-01', 'faction': ['FS']},
         ]},
    ],
}


class ImportTest(unittest.TestCase):
    def test_reads_owners_and_trims_population(self):
        index, detail = imp.system_records(SYSTEM)
        self.assertEqual(index['owners'], [{'date': '2900-01-01', 'factions': ['LA']},
                                           {'date': '3025-01-01', 'factions': ['FS']}])
        events = detail['planets'][1]['events']
        self.assertEqual([e.get('population') for e in events], [10, 12, None])
        self.assertEqual(detail['planets'][1]['gravity'], 0.9)
        self.assertEqual(detail['spectralType'], {'value': 'G2V', 'source': 'canon'})
        self.assertEqual(detail['recharge'], [{'date': '3000-01-01', 'nadir': True}])

    def test_applies_a_correction(self):
        index, detail = imp.system_records(SYSTEM)
        missed = imp.apply_corrections([index], [detail], [
            {'systemId': 'Fixture', 'path': 'planets.2.gravity', 'value': 1.05, 'source': 'Book, p.12', 'note': ''},
            {'systemId': 'Fixture', 'path': 'x', 'value': 1.75, 'source': 'Book, p.12', 'note': ''},
            {'systemId': 'Nowhere', 'path': 'x', 'value': 0, 'source': 'Book', 'note': ''},
        ])
        self.assertEqual(detail['planets'][1]['gravity'], {'value': 1.05, 'source': 'Book, p.12'})
        self.assertEqual(index['x'], 1.75)
        self.assertEqual([m['systemId'] for m in missed], ['Nowhere'])


if __name__ == '__main__':
    unittest.main()
