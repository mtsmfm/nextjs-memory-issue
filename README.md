## NextJS memory issue

```
$ fallocate -l 100M 100mbfile
$ fallocate -l 1G 1gbfile
$ npm install
$ npm run dev
```

```
$ curl localhost:3000/debug -X POST -F 'file=@./100mbfile'
"rss: 320.32 MB\nheapTotal: 113.07 MB\nheapUsed: 86.63 MB\nexternal: 248.95 MB\narrayBuffers: 242.77 MB"%
```

```
$ curl localhost:3000/debug -X POST -F 'file=@./1gbfile'
"rss: 1225.73 MB\nheapTotal: 117.02 MB\nheapUsed: 94.75 MB\nexternal: 1103.49 MB\narrayBuffers: 1099.32 MB"%
```
