+++
title = "K8s Postgre Certificate Setup"
date = 2020-05-18T21:25:18+03:00
tags = ["k8s", "postgre"]
categories = []
openGraphType = "article"
+++

The project that we are working on at home is switching from [MSSQL Server 2017](https://www.microsoft.com/en-us/sql-server/sql-server-2017) to [PostgreSQL](https://www.postgresql.org/). We've decided to move away from hosting the database inside our [k8s](https://kubernetes.io) cluster and rely on the DigitalOcean's [managed PostgreSQL](https://www.digitalocean.com/products/managed-databases-postgresql/) offering. Data is usually the core of every business and it is great if you could pay some reasonable fee in order to shift the headache of managing the db to someone else :).

## Overview

DO's PostgreSQL connection requires an ssl mode to be established while working with the db server. More information on this mode could be found [here](https://www.postgresql.org/docs/current/libpq-ssl.html). You will need a proper certificate installed on your machine in order to make the connection trusted. Otherwise you will observe an ssl-based exception in your `dotnet` code. I do not take into account `Trust Server Certificate=true` [option](https://www.npgsql.org/doc/security.html) as this is not really the case for a real-world application.

You could obtain the certificate by clicking on `Download the CA certificate` link under the `Connection Details` panel on the DO UI. So what to do next with the certificate? After some research and thinking on how to resolve the issue with a certificate the following options came to my mind:

- mount the certificate as a volume to the pod inside k8s and create custom code in order to validate the certificate;
  - npgsql driver provide an extensibility point `UserCertificateValidationCallback` on `NpgsqlConnection` that could be used in order to validate the certificate information from the volume with the one received from the server;
- create a base docker image for all our containers that will have the certificate pre-installed;
- find a way to somehow install certificate as part of the pod initialization process.

I do not like the first option due to the following reasons:

- we need to create custom `dotnet`-dependent code that will perform the certificate validation and it will be different on the env basis as our dev machines are certificate-free at the moment;
- if we are going to use a different platform (like `go`, `rust`, `elixir`) the same piece of functionality will have to be done there as well;
- this looks like the infrastructure requirement and it is better to avoid dev work if possible.

The only reason why I avoided the base docker image approach is due to the fact that we do not have one at the moment and it will require changes in all services that we have. We are using such approach at work and will revisit it once one more feature will insist to follow this path.

So the approach that I've chosen was the third one - purely devops-based. But first let's take a look at how the certificates are installed on debian-based distributions.

## Installing certificates

The process of installing ca certificates into debian (and ubuntu that is based on debian) relies on the command [update-ca-certificates](https://manpages.ubuntu.com/manpages/xenial/man8/update-ca-certificates.8.html). It worth taking a look at the man page as it shows that this command actually updates `ca-certificates.crt` in `/etc/ssl/certs`. Remember this path, it will be used later on.

Ok, so we know how to install the certificate but where should we place it? After some [research](https://askubuntu.com/questions/645818/how-to-install-certificates-for-command-line) you will find out that the path where the certificate should be placed prior to invoking `update-ca-certificates` is `/usr/local/share/ca-certificates/`.

## Configuring k8s

Now we have the certificate and know how to install it. Next step is to configure our k8s cluster in order to setup it to the proper pods. There are two k8s features that could help with this - [secrets](https://kubectl.docs.kubernetes.io/pages/app_management/secrets_and_configmaps.html) and [init containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/).

[Kustomize](https://github.com/kubernetes-sigs/kustomize) is the tool that is quite often used with k8s have a couple of options to read the secret from. Why secrets? Well, because they are supposed to be used to store sensitive information. We've decided to create a secret based on the file. Our `kustomization.yaml` is extended to have the following lines inside:

```yml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

secretGenerator:
	...
  - name: postgres-ca-cert
    files:
      - "prod/certs/postgres-ca.crt"
    type: Opaque
    ...
```

Each pod that works with the database should be extended to receive access to the secret. This could be easily done via `volumes`. However we need to install the certificate **prior** the app container starts. Here is why we need `init containers` that could be used to do some initialization logic beforehand. We define an initialization container in the following manner:

```yml
---
apiVersion: apps/v1 # for versions before 1.9.0 use apps/v1beta2
kind: Deployment
metadata: ...
spec:
  selector:
    matchLabels: ...
  template:
    metadata:
      labels: ...
    spec:
      initContainers:
        - name: rie-certs
          image: mcr.microsoft.com/dotnet/core/aspnet:3.1
          imagePullPolicy: Always
          command:
            - sh
            - -c
            - update-ca-certificates && cp /etc/ssl/certs/* /tmp/
          volumeMounts:
            - name: postgres-crt-store
              mountPath: /usr/local/share/ca-certificates/postgres-ca.crt
              subPath: postgres-ca.crt
              readOnly: false
            - name: ca-ssl-certs
              mountPath: /tmp/
      containers:
        - image: some-rie-org/some-rie-app
          name: some-rie-app
          volumeMounts:
            - name: ca-ssl-certs
              mountPath: /etc/ssl/certs
          env: ...
          ports:
            - containerPort: 5000
              name: http
      volumes:
        - name: postgres-crt-store
          secret:
            secretName: postgres-ca-cert
        - name: ca-ssl-certs
          emptyDir: {}
```

A bit of explanation:

- we are using the same base docker image that our app containers rely on;
- we defined a separate volume called `ca-ssl-certs` that is required in order to store ca certs from the `init container`;
  - this volume is mapped into the app container as well;
  - this means that if containers have some additional certificates installed they might be missing that is why we are using the same base docker image;
- the `init container` executes `update-ca-certificates` and after this copies all ca certificates to the shared with `ca-ssl-certs` volume.

When I've started the migration to PostgreSQL I had no idea that such changes to the infrastructure were required. But anyway this was a nice exercise in k8s that I've touched only once before. :)
