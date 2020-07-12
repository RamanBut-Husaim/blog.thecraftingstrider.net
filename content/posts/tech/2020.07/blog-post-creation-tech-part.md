+++
title = "A blog post creation overview - tech part"
date = 2020-07-12T14:30:33+03:00
draft = true
tags = ["blog"]
categories = []
openGraphType = "article"
+++

Recently I was working on the blog setup for [my brother](https://dr.but-husaim.net/). Under the hood it utilizes the same workflow and blogging engine that I use for mine at the moment. More precisely the buildings blocks are:

- [hugo](https://gohugo.io/) - a static site generator that allows to create blog posts in `markdown`;
- [github](https://github.com/) - a cloud platform for developers and companies to host their projects;
- [cloudflare workers](https://workers.cloudflare.com/) - a serverless platform that might be used to host static sites.

There will be a separate blog post (or a series of them) on how to setup such blog however today I want to provide some overview on how a blog post creation workflow looks like. The main reader is my brother as he is a non-tech guy, [a surgeon](https://dr.but-husaim.net/about/) however it might be useful for everyone who is interested in how post creation might look like.

A setup schema for the blog looks like this:

{{< figure src="/posts/tech/2020.07/blog-post-creation-schema.png" alt="A blog tech setup overview." >}}

## Tools

In order to make the blog management more pleasant and adequate a set of different tools has been created. Utilizing them together will speed up the mechanical part of a blog post creation and help to avoid common pitfalls. All of these tools (except `cloudflare workers`) are free to use.

### Hugo

As was mentioned above [hugo](https://gohugo.io/) is a static site generator that allow to create the content of the blog with the help of [markdown](https://daringfireball.net/projects/markdown/syntax). `Markdown` is a user-friendly plain text formatting syntax. It provides the ability to format the text (add headers, make it bold, italic, etc.) in the manner that will be both well-readable, easy to create by everyone and easy to render. Personally I try to use `markdown` everywhere where a text management is required (most of the notes, blogs, READMEs, etc.).

`Markdown` is extremely popular at the moment however web and web-browsers do not understand how to turn it into a site. This is where `hugo` comes into play. For the end-users `hugo` is an executable piece of software that converts your blog created with the help of `markdown` into a static site that could be displayed by the browsers. In order to accessible from all over the internet this static site should be hosted somewhere. For our purposes we use `cloudflare workers`.

### Visual Studio Code

[Visual Studio Code or VSCode](https://code.visualstudio.com/) is an extendable text editor used mostly by developers for their purposes. `VSCode` has a great support for `markdown` and at the same time has a set of plugins that simplifies the blog post creation significantly - grammar checking for many languages (russian included), `markdown` linters (checks whether the formatting is correct), tasks to automate publishing.

This is how the `VSCode` window looks like when I create a new blog post or edit an existing one.

{{< figure src="/posts/tech/2020.07/blog-post-creation-vs-code.png" alt="A VSCode window for blog post creation/editing." >}}

### Git

[Git](https://git-scm.com/) is a distributed version control history. What it allows to do is to track changes in files and synchronize it across different people. This is not a mandatory tool for us - using cloud storage such as `dropbox`, `onedrive`, etc. might be sufficient. However the most popular development platform [GitHub](https://github.com/) works with `git` and having a `GitHub` profile even for non-tech people is a plus in the CV.
