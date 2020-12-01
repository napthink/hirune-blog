---
title: Python の urllib.robotparser が失敗するときの対処法
date: 2020-11-27 00:13
tags:
  - Python
  - scraping
---
Python の `urllib.robotparse` を使ってrobot.txtをパースしようとしたらハマったのでメモ。

Python でクローラーを作成していて、URLへのアクセス許可やクロールする際の遅延時間を `urllib.robotparse` で取得しようとしたら、なぜか技術評論社の `robots.txt` の内容が読み込めなくて困った。

[https://gihyo\.jp/robots\.txt](https://gihyo.jp/robots.txt)（2020/11/26現在）

```
User-agent: *
Disallow: /tagList
Disallow: /*?
Allow: /*?page
Allow: /*?start
Allow: /book/genre
Allow: /book/series
Allow: /book/topics

User-agent: bingbot
Crawl-delay: 5

User-agent: Pinterest
Disallow: /

Sitemap: http://gihyo.jp/sitemap.xml
```

`robots.txt` によれば、任意のユーザーエージェントに対して `https://gihyo.jp/book/genre` へのアクセスは許可が設定されており、ユーザーエージェント `bingbot` に対して `Crawl-delay` は5秒が設定されているが、`urllib.robotparser`でそれらの設定がとれない。

```python
>>> import urllib.robotparser
>>> import urllib.request
>>> url = 'https://gihyo.jp/robots.txt'
>>> rp = urllib.robotparser.RobotFileParser(url)
>>> rp.read()
>>> rp
<urllib.robotparser.RobotFileParser object at 0x7f2678d15780>
>>> print(rp.can_fetch("*", "https://gihyo.jp/book/genre"))
False  # <- Trueが返ってきてほしい
>>> print(rp.crawl_delay("bingbot"))
None   # <- 5が返ってきてほしい
```

## ユーザーエージェントの変更

[課題 15851: Lib/robotparser\.py doesn't accept setting a user agent string, instead it uses the default\. \- Python tracker](https://bugs.python.org/issue15851)

上記サイトによると、urllibがrobots.txtを開く際に使用しているデフォルトのユーザーエージェントがサイトからブロックされている場合があるようだ。

たしかに、urllib.request.urlopen()を直接叩いて https://gihyo.jp/robots.txt にアクセスしようとすると、403が返ってくる。

```python
>>> import urllib.request
>>> url = 'https://gihyo.jp/robots.txt'
>>> urllib.request.urlopen(url)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "/usr/lib/python3.6/urllib/request.py", line 223, in urlopen
    return opener.open(url, data, timeout)
  File "/usr/lib/python3.6/urllib/request.py", line 532, in open
    response = meth(req, response)
  File "/usr/lib/python3.6/urllib/request.py", line 642, in http_response
    'http', request, response, code, msg, hdrs)
  File "/usr/lib/python3.6/urllib/request.py", line 570, in error
    return self._call_chain(*args)
  File "/usr/lib/python3.6/urllib/request.py", line 504, in _call_chain
    result = func(*args)
  File "/usr/lib/python3.6/urllib/request.py", line 650, in http_error_default
    raise HTTPError(req.full_url, code, msg, hdrs, fp)
urllib.error.HTTPError: HTTP Error 403: Forbidden
```

これを回避するには、urllib.request.install_opener()を使って、urllibにデフォルトと異なるユーザーエージェントを使うよう指示すればいい。

```python
>>> opener = urllib.request.build_opener()
>>> opener.addheaders = [('User-agent', 'MyUa/0.1')]
>>> urllib.request.install_opener(opener)
>>> urllib.request.urlopen(url)
<http.client.HTTPResponse object at 0x7feb220ee240>
>>> res = urllib.request.urlopen(url)
>>> res.status
200 # <- OK
```

`urllib.robotparser` でもちゃんと `robots.txt` の内容を読めるようになった。

```python
>>> import urllib.robotparser
>>> import urllib.request
>>> opener = urllib.request.build_opener()
>>> opener.addheaders = [('User-agent', 'MyUa/0.1')]
>>> urllib.request.install_opener(opener)
>>> url = 'https://gihyo.jp/robots.txt'
>>> rp = urllib.robotparser.RobotFileParser(url)
>>> rp.read()
>>> print(rp.can_fetch("*", "https://gihyo.jp/book/genre"))
True
>>> print(rp.crawl_delay("bingbot"))
5
```

