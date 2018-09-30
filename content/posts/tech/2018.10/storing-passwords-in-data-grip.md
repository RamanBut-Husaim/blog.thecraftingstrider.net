+++
title = "DataGrip password management on KDE and OpenSUSE"
date = 2018-09-30T21:05:32+03:00
draft = true
tags = ["tools", "linux"]
categories = []
+++

Today was the first time when I tried to launch [JetBrains DataGrip](https://www.jetbrains.com/datagrip/) on my KDE-based OpenSUSE distro that I'm actively using for development at home. Why I'm trying to reduce the usage of win 10 as much as possible is a separate story but anyway. As part of the home project that I'm involved in we are using [MSSQL Server 2017 for Linux](https://www.microsoft.com/en-us/sql-server/sql-server-2017) that could be easily started in [Docker](https://www.docker.com/). Using `DataGrip` with such setup is quite straightforward however there is one pitfall related to how `DataGrip` stores passwords. Here is the brief overview.

## Launching SQL Server for Linux

 `docker-compose` file is my preferred way to work with docker (even with single service) as it allows me to avoid memorizing the whole set of command-line arguments that could be difficult to reproduce. The docker-compose file looks something like this

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

Personally I prefer [long syntax](https://docs.docker.com/compose/compose-file/#compose-file-structure-and-examples) as it gives much more clarity on what's going on. Especially in cases when you or people in the team do not work with `docker` on regular basis. It is much easier to read and understand `docker-compose` file that uses such descriptive names.

## Connecting to SQL Server using *DataGrip*

When the docker-compose file was successfully launched I've tried to connect to it using `DataGrip`. 