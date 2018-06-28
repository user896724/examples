Welcome to my code samples repo!
=====

Each subfolder contains some working code -- from a single file to a multi-service app -- that you can run locally in a container.  Full instructions are provided in each readme.

Installing Docker and Docker Compose
-----

This varies from platform to platform and is well documented, but just in case you're on Linux and want to get up and running quickly I'll put the steps here.  General instructions can be found at [https://docs.docker.com/install/][1].

```
sudo apt-get update

sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

sudo apt-get update
sudo apt-get install docker-ce
```

(From [https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-docker-ce][2])

Check it worked: `sudo docker run hello-world`

The chess app also uses docker-compose:

```
sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose
```

(From [https://docs.docker.com/compose/install/#install-compose][3])

[1]: https://docs.docker.com/install/
[2]: https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-docker-ce
[3]: https://docs.docker.com/compose/install/#install-compose
