#noPass#

##What is noPass?##

noPass is an account manager/password manager for Google Chrome simular to other tools like 1Password and KeePass.
The big difference is that noPass never stores your passwords, it only makes sure you can log in to your sites when you want and that the accounts use safe passwords.
Read below titles to know more.

##Why should you use noPass?##

**noPass** tries to solve the issues related with sites using password and usernames as security mechanism.
Problems with password based security is that good passwords are hard for humans to remember, so they try to solve it in different ways.
Many tries to solve it by using the same password for different sites or storing their password somewhere.

noPass solves this by using the password recovery functionality everytime you want to log in.
noPass also generates a new password for you when logged in to make sure that there is a secure password used and to minimize the risk if your credentials ever comes in to wrong hands (like when a site is being breached).
Because noPass uses the password recovery functionality for the site it never stores any passwords making it more secure then other alternatives.

##How to use noPass?##

###Setup###

 1. Clone or download repository to folder on your device (You can download it here: https://github.com/flowertwig-org/noPass/archive/master.zip)
 1. Open "chrome://extensions/" in Google Chrome.
 1. Make sure to check the checkbox "Developer mode".
 1. Click button "Load unpacked extension...".
 1. Go to the root folder for the repository you just cloned/downloaded.
 1. Go throuh the setup steps that should be displayed for you now.
	
###Every day use###

On sites that noPass support, you will find this [![noPass logo](https://github.com/flowertwig-org/noPass/blob/master/resources/img/logo.png)](https://github.com/flowertwig-org/noPass/blob/master/resources/img/icon_128.png) symbol in the address bar.
By clicking the icon mentioned above you can enter your username/email (make sure it is correctly types and click update).
If you already have your username/email here and want to login, the only thing you need todo is to press the login button.
*Please note that for noPass to work you need to be logged in with the source choosed in the setup step before clicking the login button.*

Now you just need to wait and noPass will log you in for your and you can see the progress by the icon changing.

###Status indication###

**4 red fields** means it could not use your source for some reason, make sure you are logged in.
**1 red field** means that step failed and it will not continue to log you in, validate your username/email and try again.
**green fields** means that step has been finished.
**white or transparent field** indicate what step it is working on right now.

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

##Currently Supported Sites##

Go to to below address to know currently supported sites.
https://github.com/flowertwig-org/noPass/issues?q=label%3ASite+is%3Aclosed

##Site Password Strength##

* **Facebook.com** - Full complexity, allows atleast 2048 char password. *(Updated: 2015-01-05)*
* **GitHub.com** - Full complexity, only uses 72 char password (If more, rest will be ignored). *(Updated: 2015-01-05)*
* **Loopia.se** - Full complexity, allows max 127 char password. 8 chars by default from password reset. *(Updated: 2015-01-31)*
* **se.Match.com** - Full complexity, allows max 15 char password (If more, rest will be ignored). *(Updated: 2015-01-31)*
* **LinkedIn.com** - Full complexity, allows max 400 char password. *(Updated: 2015-01-31)*
* **Twitter.com** - Full complexity, allows 128 char password (But crashes on 256, more reasearch needed). *(Updated: 2015-01-31)*
* **If.se** - lower and upper case + numbers, allows max 30 char password. *(Updated: 2015-02-03)*
* **SL.se** - lower and upper case + numbers, allows max 32 char password. *(Updated: 2015-02-03)*
