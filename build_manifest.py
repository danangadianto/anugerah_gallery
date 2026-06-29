#!/usr/bin/env python3
"""Scan ./img and produce data.json used by the gallery SPA.
Usage: python build_manifest.py
"""
import os, json

ROOT = os.path.dirname(__file__)
IMG = os.path.join(ROOT, 'img')
OUT = os.path.join(ROOT, 'data.json')

def title_from_name(n):
    return n.replace('_',' ').replace('-', ' ').title()

years = []
if os.path.exists(IMG):
    for year in sorted(os.listdir(IMG)):
        ypath = os.path.join(IMG, year)
        if not os.path.isdir(ypath):
            continue
        events = []
        for ev in sorted(os.listdir(ypath)):
            evpath = os.path.join(ypath, ev)
            if not os.path.isdir(evpath):
                continue
            photos = []
            for root,_,files in os.walk(evpath):
                for f in sorted(files):
                    if f.lower().endswith(('.jpg','.jpeg','.png','.webp','.gif')):
                        rel = os.path.relpath(os.path.join(root,f), ROOT).replace('\\','/')
                        photos.append(rel)
            thumb = photos[0] if photos else ''
            events.append({ 'name': ev, 'title': title_from_name(ev), 'thumb': thumb, 'photos': photos })
        years.append({ 'year': year, 'events': events })

data = { 'years': years }
with open(OUT,'w',encoding='utf8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Wrote', OUT)
