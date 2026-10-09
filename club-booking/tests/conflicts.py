"""Exercise the exact conditional INSERT used by the D1 API with SQLite."""
import sqlite3
from pathlib import Path
sql = (Path(__file__).parent.parent / 'app/api/bookings/route.ts').read_text().split('prepare(`')[1].split('`)')[0]
db = sqlite3.connect(':memory:')
for migration in sorted((Path(__file__).parent.parent / 'drizzle').glob('*.sql')):
    db.executescript(migration.read_text())
def insert(id, club, start, end, accepted='[]', date='2026-10-10'):
    return db.execute(sql, (id, club, '活动', '活动中心 201', date, start, end, 'now', date, end, start, club, accepted)).rowcount
assert insert('a', 'A', '08:00', '09:40') == 1
assert insert('b', 'A', '09:00', '10:00') == 0
assert insert('c', 'B', '09:00', '10:00') == 0
assert insert('c', 'B', '09:00', '10:00', '["a"]') == 1
assert insert('d', 'A', '09:40', '11:00') == 0  # overlaps club B
assert insert('e', 'C', '09:20', '09:50', '["a"]') == 0  # newer conflict
assert insert('e', 'C', '09:20', '09:50', '["a","c"]') == 1
assert insert('f', 'A', '11:00', '12:00') == 1
assert insert('g', 'A', '08:30', '09:00', '["a"]') == 0  # own-club conflict cannot be overridden
assert insert('h', 'A', '08:00', '09:40', date='2026-10-11') == 1
assert insert('i', 'A', '12:00', '13:00') == 1  # touching endpoints
assert insert('j', 'B', '07:00', '14:00') == 0  # enclosing other bookings
print('PASS: 12 atomic conflict insertion cases')

assert db.execute('SELECT location FROM bookings WHERE id=?', ('a',)).fetchone()[0] == '活动中心 201'
print('PASS: location round-trip with generated migrations')
