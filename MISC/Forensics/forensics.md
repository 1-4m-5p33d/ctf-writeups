# trivial flag transfer protocol
> Figure out how they moved the flag.

## Solution:

- The file is a `.pcapng` which is associated to wireshark 
- Since this challenge is based on tftp we can go straight to export tftp objects
<img width="615" height="630" alt="image" src="https://github.com/user-attachments/assets/6565a600-4a97-465b-846b-2bcc258d1da9" />


- 6 items get exported which are
```
instructions.txt  picture1.bmp  picture2.bmp  picture3.bmp  plan  program.deb
```

- `instructions.txt` reads the following and appears to be encoded from something
```
GSGCQBRFAGRAPELCGBHEGENSSVPFBJRZHFGQVFTHVFRBHESYNTGENAFSRE.SVTHERBHGNJNLGBUVQRGURSYNTNAQVJVYYPURPXONPXSBEGURCYNA
```
- putting this txt file in online identifier (https://www.boxentriq.com/code-breaking/cipher-identifier#caesar-cipher) 
<img width="1319" height="837" alt="image" src="https://github.com/user-attachments/assets/6732c312-538c-421f-956c-511e049120a1" />


- similarly for the `plan` file
  <img width="1068" height="816" alt="image" src="https://github.com/user-attachments/assets/29d4b71f-162c-4967-a321-84c4666dc3db" />


- exploring the `.deb` using 7zip reveals that `steghide` was probably used to hide the flag
- using steghide command  `steghide extract -sf picture1.bmp`
- now it asks for a passphrase which can be found on decoding the `plan` file i.e. "DUEDILIGENCE"
- trying for all three pictures reveals the flag with the `picture3`
```
 aditya@Dell-Inspiron:~/tftp$ steghide extract -sf picture1.bmp
Enter passphrase:
steghide: could not extract any data with that passphrase!
aditya@Dell-Inspiron:~/tftp$ steghide extract -sf picture2.bmp
Enter passphrase:
steghide: could not extract any data with that passphrase!
aditya@Dell-Inspiron:~/tftp$ steghide extract -sf picture3.bmp
Enter passphrase:
wrote extracted data to "flag.txt".
```
reading the flag.txt reveals the flag `picoCTF{h1dd3n_1n_pLa1n_51GHT_18375919}`

## Flag:

```
picoCTF{h1dd3n_1n_pLa1n_51GHT_18375919}
```

## Concepts learnt:

- `.pcapng` files are used to store metadata, such as information about different capture interfaces, drop counters, and DNS records
- went through basics of steghide 

## Notes:

-  `picture2.bmp` looks suspiciously large compared to others since its nearly 35mb (apparently it isn't giving flag)
-  `due diligence` was a tough nut to crack because at first I thought it was an incorrect tangent but realised that I should try the combinations `duediligence` and `DUE DILIGENCE` and `DUEDILIGENCE`
-  for some reason I couldn't get all the files (only instructions.txt) on my windows install of wireshark but on linux all 6 showed up

## Resources:

- (https://pcapng.com/)
- (https://www.boxentriq.com/code-breaking/cipher-identifier)


***


# tunn3l v1s10n
> We found this file. Recover the flag.


## Solution:
- exiftool tells that its a .bmp image file
- I renamed it to .bmp but apparently the image is corrupted so I couldn't open it
- So I opened the image in hxd and looked up what the correct values for a bmp should be

<img width="198" height="58" alt="image" src="https://github.com/user-attachments/assets/a6218fbb-c605-43c2-a9eb-d45074c92770" />

- the pixel data offset and header size are not correct and they need to be replaced 

<img width="200" height="66" alt="image" src="https://github.com/user-attachments/assets/d019ce08-c5a8-47e4-8862-3d6b85c78581" />

- now I can open the image
![tunn3l_v1s10n](https://github.com/user-attachments/assets/4d4bc3c0-6ff7-4e9a-bb50-d3f3f29fd034)



- I belive the image has been cropped off due to corruption and it needs to be fixed
<img width="604" height="77" alt="image" src="https://github.com/user-attachments/assets/fc53ef83-3f48-499c-ae2e-84b526223382" />

- changed the `07` on `00000010` from 01 to 03 which means that I changed the height from 306 to 818 pixels
<img width="611" height="83" alt="image" src="https://github.com/user-attachments/assets/97d68d65-2fe5-418c-b9fa-bd0ec4647a7a" />

- now we can see the flag on the image
![tunn3l_v1s10n (2)](https://github.com/user-attachments/assets/c6adeda7-d586-401e-ade6-21858e09a3a7)


 ## Flag:

```
picoCTF{qu1t3_a_v13w_2020}
```


## Concepts learnt
- Ressurecting a file using hex edit



## Notes:
- exporting the image as jpg only displayed the image but not the flag in it


## Resources:
- (https://www.ece.ualberta.ca/~elliott/ee552/studentAppNotes/2003_w/misc/bmp_file_format/bmp_file_format.htm)
- (https://www.donwalizerjr.com/understanding-bmp/)
  

***


# File types

This file was found among some files marked confidential but my pdf reader cannot read it, maybe yours can.

Hints: Remember that some file types can contain and nest other files

## analysis

- exiftool reveals that its a shell script `.sh`
- actually its a shar (Shell Archive) script, an executable shell script designed to extract files without needing external archive tools like tar or zip. It relies purely on standard Unix command-line utilities.
- the script creates a directory named _sh00046
- searches the system's PATH for gettext and md5sum 
- payload inside the script is written as plain ASCII text using uuencoding
- sed removes leading X characters
- After extraction, the script sets file permissions to 0644 (-rw-r--r--), runs md5sum -c to ensure the extracted file matches the hash


## solve
- save the payload in a file
- install the sharutils package and run `uudecode payload` 
- we get a file `flag: current ar archive`


```
binwalk -e flag
cd extractions/flag.extracted/64/

binwalk -e decompressed.bin
cd extractions/decompressed.bin.extracted/0/
```

```
file decompressed.bin 
# Result: lzip compressed data, version: 1

lzip -d -k decompressed.bin

lz4 -d decompressed.bin.out flag.out
```

```
mv flag.out flag.lzma
lzma -d -k flag.lzma 

file flag 
# Result: lzop compressed data - version 1.040

lzop -d -k flag -o flag3
```

```
lzip -d -k flag3

mv flag3.out flag4.xz
xz -d -k flag4.xz

file flag4
# Result: ASCII text
```

```
cat flag4
# Output: 7069636f4354467b66316c656e406d335f6d406e3170756c407431306e5f6630725f3062326375723137795f33633739633562617d0a
```

```
echo "7069636f4354467b66316c656e406d335f6d406e3170756c407431306e5f6630725f3062326375723137795f33633739633562617d0a" | xxd -r -p
# Output: picoCTF{f1len@m3_m@n1pul@t10n_f0r_0b2cur17y_3c79c5ba}
```

## Flag 

`picoCTF{f1len@m3_m@n1pul@t10n_f0r_0b2cur17y_3c79c5ba}`

## notes
please tell me there was a better way to solve this



# Custom challenge
Can you find the flag?

Authors: Fudge,pineapple


## solve

kooking inside `C/`
- `$Extend/` (containing `$J` - the NTFS USN Journal)
- `$Recycle.Bin/`
- `Users/` inside there's the username `khalen.allam`.
- `Windows/` (`AppCompat/Amcache.hve`, `prefetch/`, `System32/winevt/logs`, `System32/config/` registry hives)


everything is dated 2024 or 2025 but a small set of files had been placed / modified later (on `2026-08-31`):

```bash
unzip -l Challenge.zip | grep "2026-08-31"

```
two files look interesting 

`C/Users/khalen.allam/AppData/Roaming/Microsoft/Windows/PowerShell/PSReadline/ConsoleHost_history.txt`


`C/Users/khalen.allam/Pictures/photo-1579952363873-27f3bade9f55.jpeg`



```bash
cat "C/Users/khalen.allam/AppData/Roaming/Microsoft/Windows/PowerShell/PSReadline/ConsoleHost_history.txt"
```
Output:
```powershell
python
python3
.\Sysmon64.exe -i .\sysmonconfig-export.xml
./kape.exe --tsource C:\ --tdest '\\vmware-host\Shared Folders\yep' --target KapeTriage --zip output
```
machine was imaged using `KapeTriage` with output sent to a VMware shared folder.

duplicate directory structure is in the `AppData\Local`:
`C/Users/khalen.allam/AppData/Local/Microsoft/Windows/PowerShell/PSReadline/ConsoleHost_history.txt`.

Checking its content:
```bash
cat "C/Users/khalen.allam/AppData/Local/Microsoft/Windows/PowerShell/PSReadline/ConsoleHost_history.txt"
```
Output:
```powershell
clear
Get-Process
cd C:\Users\Public\Documents
echo "b3_7h47_345y!!}" > 2.txt
ipconfig /all
exit
```

`"b3_7h47_345y!!}"` looks like a part of the flag

now checking the image

```
steghide extract -sf "C/Users/khalen.allam/Pictures/photo-1579952363873-27f3bade9f55.jpeg" -p "" -f
```

extracted a file `1.txt`
```
nite{df1r_n07_60nn4_
```


## flag:
nite{df1r_n07_60nn4_b3_7h47_345y!!}

