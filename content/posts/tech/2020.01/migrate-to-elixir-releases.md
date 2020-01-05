+++
title = "How I migrated my pet project from distillery to elixir releases"
date = 2020-01-05T18:48:01+03:00
draft = true
tags = ["elixir", "beam"]
categories = []
openGraphType = "article"
+++

## Intro

A core concept in the Erlang/Elixir distribution strategy is the notion of `releases`. According to [Erlang documentation](http://erlang.org/doc/design_principles/release_structure.html) `release` is

> When you have written one or more applications, you might want to create a complete system with these applications and a subset of the Erlang/OTP applications. This is called a release.

A release by itself is an artifact which contains the application and everything needed to run it. It allows developers to precompile and package all their code (and runtime) into a single unit that could be launched on any machine or container that is supported by the compiler.

Even though it is possible to distribute as a source code and compile and launch them on the target environment manually `release` is still a recommended way to do such things. The pros of `releases` are greatly outlined in the [official docs](https://hexdocs.pm/mix/master/Mix.Tasks.Release.html?#module-why-releases). In short the list looks like this

- code preloading;
- configuration and customization;
- self-contained;
- multiple releases;
- management scripts.

The closest thing in `dotnet` world is `dotnet publish` and the artifacts produced by [this command](https://docs.microsoft.com/en-us/dotnet/core/deploying/deploy-with-cli).

Prior to [Elixir 1.9](https://elixir-lang.org/blog/2019/06/24/elixir-v1-9-0-released/) the most widely used approach to create `releases` was to utilize [distillery](https://hexdocs.pm/distillery/home.html) package. As part of `1.9` a concept of `releases` was embedded inside the core distribution itself and is available via [`mix release` command](https://hexdocs.pm/mix/master/Mix.Tasks.Release.html) with no 3-rd party dependencies (that is a good thing).

## The Story
