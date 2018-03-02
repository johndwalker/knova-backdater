# Knova Backdate Utility
Utility script used during knowledgebase migrations to backdate knova-articles' created-date:
- reads/parses csv file with two expected order-dependent columns: articleIDs and backdate in `MM-DD-YYYY` format
- converts dates from csv into oracle unix timestamps
  - creates `./skippedDocs.csv` for any skipped entries due to an improper date format or articleID format
- prompts for password of `dbUser` to execute the sql commands through the oracle client
- connects and executes the sql update commands for each article to update the created-date (backdate)
  - creates `./unprocessedDocs.csv` for any articles that were not able to be processed
  - creates `./processedDocs.csv` for all articles successfully processed
- recontributes each article by calling the `recontributeUrl (-s)` replacing `{id}` with the articleID

#### Requirements:
- csv file with the first two columns being the articleIDs and then the backdate in `MM-DD-YYYY` format (i.e. `7021229,06-17-2010`)
- Oracle DB Connection details: `serverAddress, port, SID, user, password`
- Knova recontribution url with `{id}` replacement (i.e. `http://novprvwin0569.provo.novell.com:8080/webservices/services/A
uthoring?method=contribute&in0={id}&in1=0`)

#### Example execution:
```/bin/bash
node ./lib/pgcd.js -v -f "/path/to/file.csv" -i "oracleServerAddress" -p 1521 -t "dbOracleSID" -u "dbUser" -s "http://recontributeUrlWith{id}"
```

#### For additional help and switch options:
```/bin/bash
node ./lib/pgcd.js -h
```

## Using Docker:

#### Steps
- Build an image using the Dockerfile at current location:<br />`docker build -t knova .`
- Create docker container from image mounting in the csv to be used: <br />
`docker run --name knova -v '/path/to/host/articles.csv:/app/articles.csv' -t knova`
<br />*Note: csv must be mounted from host to container's `/app/articles.csv` path.*
- Get into the container's shell: <br /> `docker exec -it knova /bin/bash`
- Run the utility: <br />
`node ./lib/pgcd.js -v -f "/app/articles.csv" -i "oracleServerAddress" -p 1521 -t "dbOracleSID" -u "dbUser" -s "http://recontributeUrlWith{id}"`
- Exit from the container's shell: <br /> `exit`
- Stop & Remove the container if necessary: <br /> `docker stop knova && docker rm knova`

## Using Local Environment:

#### Installation steps:
- Environment pre-requisites without using Docker: 
  1. [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  2. [nodejs](https://nodejs.org/en/download/)
  3. [Oracle Instant Client](http://www.oracle.com/technetwork/database/database-technologies/instant-client/overview/index.html) properly configured with `LD_LIBRARY_PATH` environment variable (for more details see [oracledb quickstart](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md#quickstart) - bullet item 3)
- Pull down repo: `git clone https://github.com/johndwalker/preserve-gwava-created-date.git`
- Install dependencies: `npm install`
- See example execution section above.
