+++
title = "How I migrated my pet project from distillery to elixir releases"
date = 2020-01-11T18:48:01+03:00
tags = ["elixir", "beam"]
categories = []
openGraphType = "article"
+++

## Intro

A core concept in the Erlang/Elixir distribution strategy is the notion of `releases`. According to [Erlang documentation](http://erlang.org/doc/design_principles/release_structure.html) `release` is

> When you have written one or more applications, you might want to create a complete system with these applications and a subset of the Erlang/OTP applications. This is called a release.

A release by itself is an artifact which contains the application and everything needed to run it. It allows developers to pre-compile and package all their code (and runtime) into a single unit that could be launched on any machine or container with the platform supported by the compiler.

Even though it is possible to distribute applications in the form of source code and compile and launch them on the target environment manually `release` is still a recommended way to do such things. The pros of `releases` are greatly outlined in the [official docs](https://hexdocs.pm/mix/master/Mix.Tasks.Release.html?#module-why-releases). In short the list looks like this:

- code preloading;
- configuration and customization;
- self-contained;
- multiple releases;
- management scripts.

The closest thing in `dotnet` world (where I'm working at the moment) is `dotnet publish` and artifacts produced by [this command](https://docs.microsoft.com/en-us/dotnet/core/deploying/deploy-with-cli).

Prior to [Elixir 1.9](https://elixir-lang.org/blog/2019/06/24/elixir-v1-9-0-released/) the most widely used approach to create `releases` was to utilize [distillery](https://hexdocs.pm/distillery/home.html) package. As part of `1.9` the concept of `releases` was embedded inside the core distribution and is available via [`mix release` command](https://hexdocs.pm/mix/master/Mix.Tasks.Release.html) with no 3-rd party dependencies (that is a good thing).

## The Changes

As the application that I'm working on at the moment does not have any deployment targets this part of the story won't be covered. More details though could be discovered in the article about [hex.pm transition](http://blog.plataformatec.com.br/2019/05/updating-hex-pm-to-use-elixir-releases/).

Taking this into account the following steps should be considered as part of the transition process:

- the changes inside `mix.exs` to include information about releases;
- replace the usage of `use Mix.Config` to `import Config` in configuration files;
- a new `config/releases.exs` should be added in order to apply runtime configuration;
- remove `distillery` as a dependency as it is no longer needed;
- tune `CI` process in order to adopt new releases.

As I do not use `rel/vm.args` and `rel/hooks/pre_configure` now there was no need to transition them however it might be the case for **your** particular process.

Some more words on the each step outlined above.

### `mix.exs` & releases

Elixir core team decided to slightly change the way how releases are defined so instead of using `rel/config.exs` the standard `mix.exs` has to be extended. A well-known `project` part now relies on the new `releases` key responsible for release definition.

Please be aware that releases have sensible [defaults](https://hexdocs.pm/mix/master/Mix.Tasks.Release.html#module-options) so that they may satisfy your needs entirely. In my case I've removed `windows` executables and explicitly specified a bunch of options.

This is what could be found inside my `mix.exs`:

```elixir
  def project() do
    [
      ...
      releases: releases()
    ]
  end

  defp releases() do
    [
      dev: [
        include_executables_for: [:unix],
        include_erts: true,
        strip_beams: false,
        quiet: false
      ],
      subsys: [
        include_executables_for: [:unix],
        include_erts: true,
        strip_beams: true,
        quiet: false
      ],
      prd: [
        include_executables_for: [:unix],
        include_erts: true,
        strip_beams: true,
        quiet: false
      ]
    ]
  end
```

### `Mix.Config` deprecation

The though process around Elixir config resulted in the fact that now `Config` represents configuration both in build- and runtime. `Mix` is the tool that is available in build-time **only** and could **NOT** be used when the application is launched. As a result [Mix.Config](https://hexdocs.pm/mix/Mix.Config.html) has been deprecated in favor of [Config](https://hexdocs.pm/elixir/master/Config.html).

The change operation was simple enough - I've went through `config/config.exs`, `config/dev.exs`, `config/test.exs`, etc. and migrated `use Mix.Config` to `import Config`.

### Runtime configuration

The story behind configuration in Elixir began long time ago, prior I've started to dive deep into BEAM. There were a whole bunch of discussions on [elixir forum](https://elixirforum.com/t/rethinking-app-env/14315) and blog posts (eg. [here](https://www.amberbit.com/blog/2018/9/27/elixir-runtime-vs-compile-time-configuration/) and [here](https://dockyard.com/blog/2018/08/23/announcing-distillery-2-0)) regarding the situation. The links above could be a good start in order to understand the difficulties with config. These discussions and Paul's (aka `bitwalker`) and other community members experience & effort led to the release of `distillery 2.0` that improved the situation significantly and inspired the design inside Elixir core.

In order to use runtime-based configuration such as username/passwords, api tokens, etc. that will be read on the machine where application **starts** (not **built**) Elixir core team decided to introduce a new file `config/releases.exs`. `distillery` in comparison relied on `rel/config/*.exs` files. If the application has already used `distillery 2.0` there should be quite few changes in order to support `mix release`. In my case they have the same content.

```elixir
import Config

config :my_awesome_app,
  couchdb_url: System.fetch_env!("API_DB_CONNECTION"),
  couchdb_admin_username: System.fetch_env!("API_ADMIN_USERNAME"),
  couchdb_admin_password: System.fetch_env!("API_ADMIN_PASSWORD"),
  couchdb_user_username: System.fetch_env!("API_USER_USERNAME"),
  couchdb_user_password: System.fetch_env!("API_USER_PASSWORD")
```

### Distillery clean-up

A pretty straightforward operation that could be completed in two steps:

- `mix deps.unlock distillery` - this is required in order to clean-up `distillery` from the `mix.lock` file;
- remove `distillery` as a dependency from `mix.exs`;

### CI changes

The changes in the CI were required as `distillery` and `mix release` differ in quite few places:

- by default `distillery` creates a tarball; `mix release` do not though it is possible;
- the folder structure is slightly different in `distillery` and `mix release`;
- the commands to start the application are different as well.

### Tarball

Tarball is quite convenient way to store and distribute the application binaries and `distillery` produces it as part of the release process. At the same time the necessity to unpack tarball in docker-based deployments and multi-stage builds adds an extra-step that could be avoided.

This might be connected with the fact that `mix release` produces a plain release. It is possible to [pack](https://hexdocs.pm/mix/master/Mix.Tasks.Release.html#module-steps) the release in the tarball using `mix` even though an extra step will be required to do this.

For my application the `launch_service.sh` script that is responsible for starting the app to run API tests has changed slightly and become simpler.

Before:

```sh
mkdir -p _app/$APP_NAME
cp _build/subsys/rel/$APP_NAME/releases/*/$APP_NAME.tar.gz _app/$APP_NAME.tar.gz
tar -xzf _app/$APP_NAME.tar.gz -C _app/$APP_NAME
_app/$APP_NAME/bin/$APP_NAME start
```

After:

```sh
_build/subsys/rel/subsys/bin/subsys daemon
```

### Path

The script above shows one more difference - _the change in path_.

`distillery` utilizes the following path for its tarball - `_build/<env>/rel/<name>/releases/<version>/<name>.tar.gz`.

In comparison `mix` produces something like `_build/<env>/rel/<rel_name>/bin/<rel_name>`.

For me the absence of `version` and tarball in the default output for `mix release` may have common roots. It is possible however to get the same output with reasonable amount of tuning.

### Commands

The meaning of the commands in `distillery` and newly born `mix release` is different so it makes sense to read the docs first.

For example, `start` in `distillery` launches the app in the background as a daemon. At the same time `start` in `mix` makes the app running in the foreground. The equivalent of `start` is `daemon` command in `mix` and that is what you could see in the above example. For me there is no big difference in understanding and they both work fine when you've played some time with the tool and its docs.

## Summary

Elixir 1.9 finally closed the gap in the out of the box tooling. Even though there are differences between `mix release` and `distillery` it is quite clear that the great design and implementation work done by the creators of `distillery` influenced the newborn feature. For me it took about 2 hours to migrate my simple project to `mix release` and I'm quite happy with it for now.
