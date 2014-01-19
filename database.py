
import sqlite3 as sql
import os

class DB:
    def __init__(self,db,cur):
        self.db = db
        self.cur = cur

def connect(file):
    db = sql.connect(file)
    cur = db.cursor()
    
    cur.execute('pragma foregin_keys = ON')
    
    cur.execute('pragma user_version')
    v = cur.fetchone()[0]
    
    if v == 0:
    
        cur.execute('drop table if exists photos')
        cur.execute('''create table photos (
                id integer primary key,
                path text,
                extension text,
                size integer,
                rating integer
                )''')        
        cur.execute('''create table labels (
                id integer primary key,
                name text,
                parent_id integer,
                foreign key(parent_id) references labels(id)
                )''')
        cur.execute('''create table label_photo (
                photo_id integer,
                label_id integer,
                primary key(photo_id,label_id)
                )''')
        
        cur.execute('pragma user_version = 1')
                
    db.commit()
    return DB(db,cur)
                

def push_label(db,name,parent):
    db.cur.execute('insert into labels values (null,?,?)', (name,parent))
    db.cur.execute('select last_insert_rowid()')
    return db.cur.fetchone()[0]
    
    
def add_label(db,photo,label):
    db.cur.execute('insert into label_photo values (?,?)',(photo,label))


def push_photo(db,path):
    size = os.stat(path).st_size
    name,ext = os.path.splitext(path)
    
    db.cur.execute('insert into photos values (null,?,?,?,-1)', (path,ext,size))
    db.cur.execute('select last_insert_rowid()')
    return db.cur.fetchone()[0]
    
    
def get_photos_in_label(db,label):
    db.cur.execute('''select photos.id 
                        from label_photo 
                        left outer join photos on label_photo.photo_id=photos.id 
                        where label_photo.label_id=?''',(label,))
    
    paths = []
                      
    for r in db.cur.fetchall():
        paths.append(r[0])
        
    return paths
    
def get_photos_in_label_and_sublabels(db,label):
    paths = []
    for l in get_all_children(db,label):
        paths += get_photos_in_label(db,l)
    return paths
    
def get_all_children(db,label):
    lbl = [label]
    for l in get_sub_labels(db,label):
        lbl += get_all_children(db,l)
    return lbl
    
def get_sub_labels(db,label):
    db.cur.execute('select id,name from labels where parent_id=?',(label,))
    return db.cur.fetchall()
   
def get_image_path(db,id):
    db.cur.execute('select path from photos where id=?',(id,))
    return db.cur.fetchone()[0]
