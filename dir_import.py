

import os
import filecmp
import sys

from database import ImgnetDatabase
import datastore


def import_directory(db_handle, path, label_id, include_subdirectories=True):

    path += '/'

    dirs = filter(os.path.isdir, [path + r for r in os.listdir(path)])
    files = filter(os.path.isfile, [path + r for r in os.listdir(path)])

    for f in files:

        found_dup = False
        for p in db_handle.get_photos_of_size(f):
            if filecmp.cmp(datastore.get(p[0]), f):
                print("Duplicate Found: ", f, p[0])
                db_handle.label_photo(p[0], label_id)
                found_dup = True
                break

        if not found_dup:
            pid = db_handle.add_photo(f)
            datastore.add(f, pid)
            db_handle.label_photo(pid, label_id)

    if include_subdirectories:
        for d in dirs:
            name = d.replace(path, '')
            child_label = db_handle.create_label(name, label_id)
            import_directory(db_handle, d, child_label)


if __name__ == "__main__":

    db = ImgnetDatabase()

    lid = db.create_label(sys.argv[2])
    import_directory(db, sys.argv[1], lid)

    db.commit()
    db.close()