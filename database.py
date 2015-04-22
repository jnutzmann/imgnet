
import sqlite3 as sql
import os
from config import Config


class ImgnetDatabase:

    def __init__(self):

        self.db = sql.connect(Config.DATABASE, check_same_thread=False)

        self.cur = self.db.cursor()
        self.cur.execute('pragma foreign_keys = ON')
        self.cur.execute('pragma user_version')

        v = self.cur.fetchone()[0]
        if v == 0:
            self.cur.execute('drop table if exists photos')

            self.cur.execute('''create table photos (
                    id integer primary key,
                    original_path text,
                    extension text,
                    size integer
                    )''')

            self.cur.execute('''create table labels (
                    id integer primary key,
                    name text,
                    parent_id integer,
                    foreign key(parent_id) references labels(id)
                    )''')

            self.cur.execute('''create table label_photo (
                    photo_id integer,
                    label_id integer,
                    primary key(photo_id, label_id) on conflict ignore
                    )''')

            self.cur.execute('pragma user_version = 1')
            self.cur.execute('insert into labels values (?,?,?)', (0, 'root', None))

        self.db.commit()

    def commit(self):
        self.db.commit()

    def close(self):
        self.cur.close()
        self.db.close()

    # ========== PHOTOS ===========

    def get_photos_of_size(self, path):
        size = os.stat(path).st_size
        self.cur.execute('select id from photos where size=?', (size,))
        return self.cur.fetchall()

    def add_photo(self, path):
        size = os.stat(path).st_size
        name, ext = os.path.splitext(path)
        self.cur.execute('insert into photos values (null,?,?,?)', (path, ext, size))
        self.cur.execute('select last_insert_rowid()')
        return self.cur.fetchone()[0]

    # ========== LABELS ===========

    def create_label(self, name, parent=0):
        self.cur.execute('insert into labels values (null,?,?)', (name, parent))
        self.cur.execute('select last_insert_rowid()')
        return self.cur.fetchone()[0]

    def label_photo(self, photo, label):
        self.cur.execute('insert into label_photo values (?,?)', (photo, label))

    def get_labels_on_photo(self, photo):
        self.cur.execute('''select labels.id,labels.name
                            from  label_photo
                            left outer join labels on label_photo.label_id=labels.id
                            where label_photo.photo_id=?''', (photo,))
        return self.cur.fetchall()

    def get_photos_in_label(self, label):
        self.cur.execute('''select photos.id
                            from label_photo
                            left outer join photos on label_photo.photo_id=photos.id
                            where label_photo.label_id=? and extension=?''', (label, '.jpg'))  # TODO: why is this jpg?

        photo_ids = []

        for r in self.cur.fetchall():
            photo_ids.append(r[0])

        return photo_ids

    def get_photos_in_label_and_sublabels(self, label):
        photo_ids = []
        for l in self.get_all_children(label):
            photo_ids += self.get_photos_in_label(l)
        return photo_ids

    def get_all_children(self, label):
        lbl = [label]
        for l, n in self.get_sub_labels(label):
            lbl += self.get_all_children(l)
        return lbl

    def get_label_name(self, label):
        self.cur.execute('select name from labels where id=?', (label,))
        return self.cur.fetchone()[0]

    def get_sub_labels(self, label):
        self.cur.execute('select id, name from labels where parent_id=?', (label,))
        return self.cur.fetchall()


