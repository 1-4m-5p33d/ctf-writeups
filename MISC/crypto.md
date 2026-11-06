# Shared secrets 
A message was encrypted using a shared secret... but it looks like one side of the exchange leaked something. Can you piece together the secret and get the flag?

[message, encryption.py]

Hints
What do you get if you combine a public key with a known private one?


## solve

- use the numbers from the message and reverse the below XOR 
```
enc = bytes([x ^ (shared % 256) for x in flag])
```

```python
from Crypto.Util.number import getPrime
from random import randint

# Public parameters
g = 2
p = 1956569462124144120927516603113307342059707107041776251382271693463937241063820255709629168777374737667208516650717581395312046085361630148846651320257607452794725002805439585363971052627026550220846887477426409169351921723292099694133435829849883814647198776499989842804756329565447939544979714484098170215811901531

# Server's secret
a = randint(2, p-2)
A = 931780738198281296211749377511067641284863737571398823102378457288610879254180894416050020080780628696763747514178266509702673475751515961108976341966930280919685252014298308041840547639808223487738126770556950245728123977970401778765098666948956348514166454002350485828853683051595560314986283370486734230343596399

# Client secret
b = 260024648794868391882100673000371207275949096044539852160954951753990369171768152066079229717908110629568180380165307426003362548192746066803683648511956380368235275176198731215576063181488487580920755155921370162185640897063549229109151325400015464854720901690070276368324510352882682082355311651860741578032190849  

B = pow(g, b, p)

# Shared key
shared = pow(A, b, p)
enc_hex = "3e272d210d1a08352a26113d7d2d3c7d3a1177797c2a2d77287d33"
enc_bytes = bytes.fromhex(enc_hex)
flag = bytes([x ^ (shared%256) for x in enc_bytes]).decode()

print(flag)

# # Encrypt flag
# flag = b"picoCTF{...}"
# enc = bytes([x ^ (shared % 256) for x in flag])

# # Write challenge info
# with open("file.txt", "w") as f:
#     f.write(f"g = {g}\n")
#     f.write(f"p = {p}\n")
#     f.write(f"A = {A}\n")
#     f.write(f"b = {b} \n")
#     f.write(f"enc = {enc.hex()}\n")
```

## Flag:
```
picoCTF{dh_s3cr3t_972dc9f3}
```


# basic-mod2
A new modular challenge!

Take each number mod 41 and find the modular inverse for the result. Then map to the following character set: 1-26 are the alphabet, 27-36 are the decimal digits, and 37 is an underscore.

Wrap your decrypted message in the picoCTF flag format (i.e. picoCTF{decrypted_message})

Hints
Do you know what the modular inverse is?

The inverse modulo z of x is the number, y that when multiplied by x is 1 modulo z

It's recommended to use a tool to find the modular inverses


## solve

for a given x 
r = x mod41

we need to find y = r_inv mod41 such that r*x mod41 = 1

by fermat's little theorem r_inv = r**39 mod41

then map it to corresponding alphanumeric

```python
numbers = [432, 331, 192, 108, 180, 50, 231, 188, 105, 51, 364, 168, 344, 195, 297, 342, 292, 198, 448, 62, 236, 342, 63]

decoded_chars = []
for num in numbers:
    r = num % 41
    inv = pow(r, -1, 41)  # Modular inverse mod 41
    
    if 1 <= inv <= 26:
        char = chr(ord('A') + inv - 1)
    elif 27 <= inv <= 36:
        char = chr(ord('0') + inv - 27)
    elif inv == 37:
        char = '_'
    else:
        char = '?'
        
    decoded_chars.append(char)

message = "".join(decoded_chars)
print(f"picoCTF{{{message}}}")`
```

## Flag:
```
picoCTF{1NV3R53LY_H4RD_C680BDC1}
```




# No Padding, No problem
Oracles can be your best friend, they will decrypt anything, except the flag's ciphertext. How will you break it?

Connect with nc wily-courier.picoctf.net 57564.

Hints
What can you do with a different pair of ciphertext and plaintext? What if it is not so different after all...


## solve

- no padding so we can exploit it with homomorphism

enc(m1*m2) = (m1*m2)**e modn = (m1**e modn) * (m2**e modn) = enc(m1) * enc(m2) modn

cipher = 41087590808195683068219397996200752957010844511961401049934182254620591266479443856509672337635209432543511905695056369909819389812443735281350877228389709756211243889680647892913994812860934148443278128983996695260455429642864678430883748055357797750230487584895669074708274499471895406452875097161309994345

enc(2*m1) = (enc(2) * cipher)modn

c = enc(2*num) = ((pow(2, e, n))*cipher)%n

m = c**d modn
m = m1*2 modn
m1 = m/2


```python
from pwn import *
from Crypto.Util.number import long_to_bytes

HOST = "wily-courier.picoctf.net"
PORT = 62686

io = remote(HOST, PORT)

# Read n, e, ciphertext
io.recvuntil(b"n: ")
n = int(io.recvline().strip())

io.recvuntil(b"e: ")
e = int(io.recvline().strip())

io.recvuntil(b"ciphertext: ")
c = int(io.recvline().strip())

print(f"n = {n}")
print(f"e = {e}")
print(f"c = {c}")

c2 = pow(2, e, n)

# Modified ciphertext
new_c = (c * c2) % n

# Ask the oracle to decrypt it
io.recvuntil(b"Give me ciphertext to decrypt: ")
io.sendline(str(new_c).encode())

response = io.recvline().strip()

print(f"oracle response = {response}")

value = int(response.split()[-1])

# Oracle gave us 2*m
m = value // 2

flag = long_to_bytes(m)

print(f"flag = {flag.decode()}")

io.close()
``` 

## flag:
```
picoCTF{m4yb3_Th0se_m3s54g3s_4r3_difurrent_2f44d25d}
```


# Sum-O-Primes

We have so much faith in RSA we give you not just the product of the primes, but their sum as well!

gen.py
output.txt

hint: I love squares :)


## solve

x = p+q
n = p*q
c is ciphertext

a**2 - (p+q)a + (p*q) = 0
a**2 - xa + n = 0

solution using the quadratic eqn

(p, q) = (-x +- (x**2 - 4n))/2

and then reverse this block 

```
m = math.lcm(p - 1, q - 1)
d = pow(e, -1, m)

c = pow(FLAG, e, n)
```


## soln script

```python
from Crypto.Util.number import long_to_bytes
import math

x = int("1626a189dcb38ca6b8e9ee26623ab5c3c6cd7e4c7ff6726f4b03831ca48c617a056827c5763458d0aa7172650072b892649cc73f943f156b795ff5dd2fc9a53b140cf9c3ee2cbb8181d17bb0275f404b4090766f798ad156db7e71000e93db65f3e1bc7406532d0f509fbecf095ef215b4ad51f5e8ac765861e5f93808948bf72", 16)
n = int("720d66204ec312d7f1bc688495d4585ec58520170b86ed3488c3f9c76407b7e9e466b82a282ba90d484698160f2e27f413b07cf8805d560abdffa977547d5fec3190a1ce284dfc8e92193f2f70590bf9c6e6d0ab449e35ef43ed20232b7f8686696125cde1f950230fbc6858392a3715c1b8a4947748b7fadd5cc921716ad5e0129c91ea88fceee140fb1c594606186afacb69143ef8f7b3b1aa2cc3206395c60e71ec0555dd15838d8a8395e8ccf9a4e4c4199ae0ab3f8af7ebc6605edc5ddd480be2d6c41e38618eba5822a1e566080877268802750de71e890ac865ebf87fdc290d9151e407dff4c97390c9e7388fd538e2716515cea2240f55963c2e0c21", 16)
c = int("554b90eb12fbece709d7bf23ab91f9b52d71cd77fbf42f65d68623c2055d99956b9bcf2eaf14771fa5781fae86624e44b452a0f68768849faba1b9695ce353a17238a3e7040ee7aede68b35bf4b51daf0982653910b280ac98aad9a5b3c49d226e10b2e8660effc2cb2a553039bde527e42f1795bc078af6ed2928505be6df1ebe993f2ed8c10477dd5cc9f899d1e69b6512b71c732472dde521f5393c76b2f9fbed668560d4e50ca177dd14b923414549d688b20fab94dba7cad7b5a729941c772dc4a1db79b0e6a111d2d2e8998b4e2a272dc940a9dd4cf856faa5a2ee0cb6f36f0ce6edbb421697e517a4d589cc5a880eecf6fbf65e5f6a1a437b06e5ff9a", 16)
e = 65537

s = x
discriminant = s**2 - 4 * n

sqrt_disc = math.isqrt(discriminant)

p = (s + sqrt_disc) // 2
q = (s - sqrt_disc) // 2

phi = (p - 1) * (q - 1)
d = pow(e, -1, phi)
m = pow(c, d, n)

flag = long_to_bytes(m)
print("Flag:", flag.decode())
```

## flag
```
picoCTF{pl33z_n0_g1v3_c0ngru3nc3_0f_5qu4r35_92fe3557}
```