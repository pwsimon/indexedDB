# Install/Setup
ich mach mal einen versuch mit einem Build-Environment (npm)
gem [BabelJS - Environment Setup](https://www.tutorialspoint.com/babeljs/babeljs_environment_setup.htm)

Ein deployment/installation laeuft dann:  
[Cloning with HTTPS URLs](https://docs.github.com/en/free-pro-team@latest/github/using-git/which-remote-url-should-i-use#cloning-with-https-urls), [npm install](https://docs.npmjs.com/cli/install.html)

    git clone "https://github.com/pwsimon/indexedDB.git"
    cd indexedDB
    npm install --only=prod
    npm run babel

Ein clone zur entwicklung laeuft dann:

    git clone "https://github.com/pwsimon/indexedDB.git"  
    cd indexedDB
    npm install --only=dev
    npm run babel

# Development-Cycle
[Use a source map](https://developer.mozilla.org/de/docs/Tools/Debugger/How_to/Use_a_source_map)  
[Set Up Persistence with DevTools Workspaces](https://developers.google.com/web/tools/setup/setup-workflow)  
fuer den Development-Cycle nutzen wir einen ReBuild onChange
    npx babel --watch src --out-dir dev
    npx babel src -d dev

# Same Origin
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