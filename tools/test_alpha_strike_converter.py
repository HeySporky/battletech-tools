import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from alpha_strike_converter import convert, load_rules


class AlphaStrikeConverterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rules = load_rules(Path(__file__).with_name("alpha-strike-conversion-rules.json"))

    def test_lrm_5_matches_existing_catalog_calibration(self):
        result = convert({
            "name": "LRM 5",
            "heat": 2,
            "damage_clusters": 5,
            "damage_per_cluster": 1,
        }, "standard-lrm-catalog-calibration", self.rules)

        self.assertEqual(result["status"], "calculated")
        self.assertEqual(result["range_short"], 0.15)
        self.assertEqual(result["range_medium"], 0.3)
        self.assertEqual(result["range_long"], 0.3)

    def test_unknown_family_is_blocked(self):
        result = convert({"name": "MRM 10", "heat": 4, "rack_size": 10}, None, self.rules)
        self.assertEqual(result["status"], "unresolved")
        self.assertEqual(result["promotion"], "blocked")

    def test_unsupported_srm_rack_is_blocked(self):
        result = convert({"name": "SRM 8", "heat": 5, "rack_size": 8}, "standard-srm-catalog-calibration", self.rules)
        self.assertEqual(result["status"], "unresolved")

    def test_workbook_lookup_is_explicitly_provisional(self):
        result = convert({"name": "Large Laser"}, None, self.rules, {
            "large laser": {
                "Weapon": "Large Laser",
                "Heat": 8,
                "Short": 0.8,
                "Medium": 0.8,
                "Long": 0,
                "Extreme": 0,
                "source": "Alpha Strike Converter v2.3 workbook",
                "source_status": "provisional",
            }
        })
        self.assertEqual(result["status"], "calculated-provisional")
        self.assertEqual(result["range_short"], 0.8)
        self.assertEqual(result["promotion"], "review-required")

    def test_workbook_notation_is_normalized(self):
        result = convert({"name": "MRM 10"}, None, self.rules, {
            "mrm 10": {
                "Weapon": "MRM 10*",
                "Heat": 4,
                "Short": 0.4,
                "Medium": 0.4,
                "Long": 0.4,
                "Extreme": 0,
                "source": "Alpha Strike Converter v2.3 workbook",
                "source_status": "provisional",
            }
        })
        self.assertEqual(result["status"], "calculated-provisional")
        self.assertEqual(result["heat"], 4)


if __name__ == "__main__":
    unittest.main()