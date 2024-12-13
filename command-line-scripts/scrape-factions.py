import sys
import os
import statistics
import csv
import time
from datetime import date, datetime
import urllib.request
import json

theUrl = "https://masterunitlist.azurewebsites.net/Unit/QuickList?MinPV=1&MaxPV=999&Name=adgasdfgasdfg&Factions="


#usage python3 scrape-factions.py > factions.csv
#Brute forces the API - Don't be a jerk when running it
#For loop 1 to 200
for i in range(1, 200):
    #convert i to string
    response = urllib.request.urlopen(theUrl+str(i)).read()
    parsed = json.loads(response)
    print (str(i)+","+parsed['Crumbs'][1]['Value'])
