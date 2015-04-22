
import os
import shutil

from config import Config


def add(path, image_id, overwrite_ok=False):

    if not os.path.exists(Config.DATASTORE):
        os.makedirs(Config.DATASTORE)

    p = os.path.join(Config.DATASTORE, str(image_id))

    if os.path.exists(p) and not overwrite_ok:
        raise Exception("Attempted to overwrite data in the datastore.")

    shutil.copy(path, p)


def get(image_id):

    p = os.path.join(Config.DATASTORE, str(image_id))

    if os.path.exists(p):
        return p
    else:
        raise Exception("Datastore item not found.")

