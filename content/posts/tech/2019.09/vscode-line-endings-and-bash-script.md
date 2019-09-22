+++
title = "Visual Studio Code, line endings and a bash script"
date = 2019-09-22T16:30:18+03:00
tags = ["bash", "azure devops"]
categories = []
+++

As part of the home project that I'm working on we actively use [Azure DevOps](https://azure.microsoft.com/en-us/services/devops/) to store the source code and run quite simple CI. Recently I've customized the pipeline to run API tests as part of the build process. In order to do this I had to create a bunch of `bash`-scripts and faced an issue with line endings for such files.

[Visual Studio Code](https://code.visualstudio.com/) is an awesome editor created by Microsoft that could be used to work with almost any language in a more or less comfortable manner. Personally I'm using it for everything except `dotnet` as experience with [JetBrains Rider](https://www.jetbrains.com/rider/) is a way-way better.

## Overview

As part of the pipeline I run integration tests on the dockerized version of the application. API tests are integration ones in essence and we launch a database and [wiremock](http://wiremock.org/) containers as well to make the service work correctly. It is quite convenient to use `docker-compose` for such tasks however there is one important thing - `docker` ensures that the container is running, not that is **ready**. See [docs](https://docs.docker.com/compose/startup-order/) for more info. This means that applications developers should know better how measure this _readiness_ for their services.

In our case a service is considered fully functional when the `health` endpoint returns `200`. Only when service is up and running we could start testing it with `xUnit`. Here is where a `bash` script comes into play.

## The Issue

A `bash`-script is quite straightforward by its nature however it took me a couple of hours to write it and verify. For curious the health check fragment of the script looks something like this:

```sh
echo "waiting for the API service to start"
ATTEMPT=1
while [ "$(curl -sL -o /dev/null -w ''%{http_code}'' localhost:16200/health)" != "200" ]
do
    if [$ATTEMPT -gt 10]
        then
            echo "service is unhealthy, number of attempts=$ATTEMPT is exceeded"
            exit 1
    fi

    echo "service is unhealthy, attempt=$ATTEMPT, sleeping for 1 second"
    sleep 1
    ATTEMPT=$[$ATTEMPT + 1]
done
echo "service is healthy, number of attempts=$ATTEMPT"
```

Prior to commit the changes and verify them in the cloud I've decided to test the script locally. Due to the local `zsh`-by-default setup I've launched the following command `bash test-health-check.sh`. The output was `test-health-check.sh: line 16: syntax error: unexpected end of file`.

Interesting. Based on the previous experience I know that `VSCode` displays line endings in the status bar for convenience. In my case it was `CRLF` that made `bash` to display an error in the console.

{{< figure src="/posts/tech/2019.09/vscode-line-ending_01.png" alt="VSCode Line Ending" >}}

The strange thing was that when I've tried to change it to `LF` and save the file it was automatically returned to `CRLF`. After some search I've found the [issue](https://github.com/Microsoft/vscode/issues/2957) inside `VSCode` repository regarding `CRLF`, end-of-line and its configuration. However this setting affects all files disregards their extension that is not acceptable for our multi-OS dev environments.

## Solution

Given some more though on the topic the solution came to my mind. I\m fan of [editorconfig](https://editorconfig.org/) and try to use it on every project that I'm working on. `VSCode` knows how to work with `editorconfig` properly with the help of [official extension](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig). The solution is to extend the `.editorconfig` file in the folder by adding the following lines:

```ini
[*.sh]

end_of_line = lf
```

Such config tells `VSCode` to automatically change the line endings in `shell` files to `LF` on save.
