For most programmers I find a bit of documented code is a lot more helpful then pages of documentation.  With that in 
mind this is library is not really ment for anyone to use as is but as a guideline on how to implement Digi-ID in your
product.

# What is Digi-ID?

Digi-ID is a secure, anonymous, and free proof of ownership system.  In general a web site will show a clickable QR code
encoded with a special URI.  The general uri format is:

digiid://{call back URL missing the HTTPS}?x={Random value to make unique called an nonce}&{other possible parameters}

In some special cases like physical entry a static image may be preferable to a dynamic one in which case the nonce
should be left off and the wallet should generate its own based on the number of ms since Thursday, January 1, 1970 0:00:00 UTC.
In this way there will always be a unique nonce and the device being access can invalidate signatures soly by how old 
they are.

#BIP39:

BIP39 is the industry standard for converting a mnemonic made up of 3 to 24 words(No less then 12 is recomended but 
"ask ask ask" is useful for testing).  Please always verify your wallet generates addresses correctly based on this 
standard.  An handy reference tool can be found at https://iancoleman.io/bip39/

#Testing:
I have written a simple test tool available at: https://digibyte.rocks/test/index.php

#Donations:
Though not necessary they are appreciated:
DSXnZTQABeBrJEU5b2vpnysoGiiZwjKKDY
