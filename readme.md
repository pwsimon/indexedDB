alle anwendungen (PWA's) die von einem anderen Host bereitgestellt werden bzw. ein login auf einem beliebigen server erlauben haben ein ernstes Problem mit der "Same Origin Policy"
1.) credentialsManager API
der browser kann Credentials ausschliesslich auf basis der BaseUrl der Anwendung verwalten.  
diese unterscheidet sich aber immer von dem API Host. (evtl. Federation Credentials)
2.) IndexedDB
der locale Storage ist zwingend durch die BaseUrl der Anwendung festgelegt.  
ergo kann man die Anwendung nicht einfach zu einem anderen Provider verschieben.  
also z.B. von https://IndexedDB.azurewebsites.net/ nach https://ucs.estos.de/IndexedDB/
loesungsansatz:
der ServerName ist teil des Database/Store-Name