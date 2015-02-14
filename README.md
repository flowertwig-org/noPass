#noPass#

##What is noPass?##

TBD

##Why should you use noPass?##

**noPass** tries to solve the issues related with sites using password and usernames as security mechanism.
Problems with password based security is that good passwords are hard for humans to remember, so they try to solve it in different ways.
Many tries to solve it by using the same password for different sites or storing their password somewhere.

noPass solves this by using the password recovery functionality everytime you want to log in.
noPass also generates a new password for you when logged in to make sure that there is a secure password used and to minimize the risk if your credentials ever comes in to wrong hands (like when a site is being breached).
Because noPass uses the password recovery functionality for the site it never stores any passwords making it more secure then other alternatives.

##How to use noPass?##

TBD

##How does noPass work?##

When you want to login to a site supported by **noPass**, noPass triggers the password recovery functionality of the site in question.
As you are logged in to the email source (like Gmail or other supported sources) noPass can read the password recovery email and log you in.
Before noPass finishes it ensures the password is set to a new secure password (See **Site Password Strenght**).

Eventhough most sites have a simular password recovery functionality some modifications needs to be done, because of this we have a separate module for every site.
Email sources are modules aswell and support can be added relativly easy.

##Security conserns using noPass##

As noPass is only using functionality already available for you or hackers on the site in question it should not increase your risk by using it.
But you should ensure that you are not automatically logged in to a email sourcce (like Gmail) by opening a browser window if you leave your computer where other people can access it.
You should also make sure that the only password that you need to handle by yourself (the password to the email source) is a secure one.

Please note that we are currently using a unique password (60 char long) for every site supported by noPass.
In the future we will change that to better match the strongest password allowed for each site.

##Site Password Strenght##


* **Facebook.com** - Full complexity, allows atleast 2048 char password. *(Updated: 2015-01-05)*
* **GitHub.com** - Full complexity, only uses 72 char password (If more, rest will be ignored). *(Updated: 2015-01-05)*
* **Loopia.se** - Full complexity, allows max 127 char password. 8 chars by default from password reset. *(Updated: 2015-01-31)*
* **se.Match.com** - Full complexity, allows max 15 char password (If more, rest will be ignored). *(Updated: 2015-01-31)*
* **LinkedIn.com** - Full complexity, allows max 400 char password. *(Updated: 2015-01-31)*
* **Twitter.com** - Full complexity, allows 128 char password (But crashes on 256, more reasearch needed). *(Updated: 2015-01-31)*
* **If.se** - lower and upper case + numbers, allows max 30 char password. *(Updated: 2015-02-03)*
* **SL.se** - lower and upper case + numbers, allows max 32 char password. *(Updated: 2015-02-03)*
