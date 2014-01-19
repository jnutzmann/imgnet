import database
import dir_import

db = database.connect('test.db')
lid = database.push_label(db,'config',None)

dir_import.import_dir(db,'/home/jnutzmann/config',lid)

db.db.commit()
