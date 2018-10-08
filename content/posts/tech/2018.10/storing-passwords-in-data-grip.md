+++
title = "DataGrip password management on KDE and OpenSUSE"
date = 2018-09-30T21:05:32+03:00
tags = ["tools", "linux"]
categories = []
+++

Today was the first time when I tried to launch [JetBrains DataGrip](https://www.jetbrains.com/datagrip/) on my KDE-based OpenSUSE distro that I'm actively using for development at home. Why I'm trying to reduce the usage of win 10 as much as possible is a separate story but anyway. As part of the home project that I'm involved in we are using [MSSQL Server 2017 for Linux](https://www.microsoft.com/en-us/sql-server/sql-server-2017) that could be easily started in [Docker](https://www.docker.com/). Using `DataGrip` with such setup is quite straightforward however there is one pitfall related to how `DataGrip` stores passwords. Here is the brief overview.

## Launching SQL Server for Linux

 `docker-compose` file is my preferred way to work with `docker` (even with single service) as it allows me to avoid memorizing the whole set of command-line arguments that could be difficult to reproduce. The docker-compose file looks something like this

```yml
version: "3.5"
services:
  sql-server-dev:
    image: microsoft/mssql-server-linux:2017-latest
    ports:
      - target: 1433
        published: 1433
        protocol: tcp
        mode: host
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "my_Aw3s0me_Pwd"
    volumes:
      - type: volume
        source: sql-server-data
        target: /var/opt/mssql
volumes:
  sql-server-data:
```

Personally I prefer [long syntax](https://docs.docker.com/compose/compose-file/#compose-file-structure-and-examples) as it gives much more clarity on what's going on. Especially in cases when you or your team do not work with `docker` on regular basis. It is much easier to read and understand `docker-compose` file that uses such descriptive names.

## Connecting to SQL Server using *DataGrip*

When the `docker-compose` file was successfully launched I've tried to connect to it using `DataGrip`. The procedure is quite intuitive and straightforward on MacOS/Windows machines that I've used previously. At least in standard configuration. The connection screen may look something like this.

{{< figure src="/posts/tech/2018.10/storing_passwords_in_data_grip_01.png" alt="SQL Server Connection in DataGrip" height="400" >}}

Completing a form and verifying connection took me a couple of minutes. After that I've refreshed the database list without expecting any difficulties and suddenly they occurred. To my surprise any server-related action (refreshing db list, loading tables, etc.) made `DataGrip` open credentials window and ask for my password. I've tried to restart `DataGrip`, re-enter creds, recreate a connection event though there was nothing special the sql server container logs. No success.

Next step - start to [duckduckgoling](https://duckduckgo.com/) the issue and successfully the clue has been found. There is an issue in `IntelliJ Idea` bug tracker - [Allow storing passwords using KWallet](https://youtrack.jetbrains.com/issue/IDEA-163275) and related `DataGrip` issue - [Database too window cant remember password (even if check "Remember" checkbox](https://youtrack.jetbrains.com/issue/DBE-6402). `KDE` desktop env uses [KWallet](https://en.wikipedia.org/wiki/KWallet) for creds management. Though `git` integrates with `KWallet` natively it still not supported in `DataGrip`.

Previously I've faced a couple of issues with `JetBrains` products and there was always a workaround if something did not work. So the first idea was to look in `DataGrip` settings and verify what other options are provided to control the creds storage. There are two of them available out of the box:

+ native creds management solution that is selected by default;
+ using [KeePass](https://keepass.info/) database;

{{< figure src="/posts/tech/2018.10/storing_passwords_in_data_grip_02.png" alt="Password Configuration in DataGrip" height="400" >}}

KeePass... I'm a big fan of this really amazing product and use them across all the devices (mac, desktop, android). There is a security note about using `keepass` database (encrypted storage) and it is up to you what path to follow. For my particular case (storing dev db creds) this plays nice without any encryption so I've moved forward with standard setup and the issue with creds was finally resolved!

That's it. Happy coding!

*PS:* `DataGrip` [issue](https://youtrack.jetbrains.com/issue/DBE-6402) contains a reply from `Vasily Chernov` - a `JetBrains` guy who advised to use `KeePass` as a temporary solution as well. Though it is unclear when it will be done. I've upvoted the issue (to get notifications) and advise everyone to do this as it increase the chance to get the issues fixed sooner.