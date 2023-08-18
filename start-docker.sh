#!/bin/sh

[[ ! -z "${USER_UID}" ]] && usermod -u ${USER_UID} node || echo "No USER_UID specified, leaving 1000"

if [[ ! -z "${USER_GID}" ]]; then
    echo "USER_GID is not empty. Its value is: ${USER_GID}"
    groupdel $(getent group ${USER_GID} | cut -d ':' -f 1) --force
    groupmod -g ${USER_GID} node || echo "No USER_GID specified, leaving 1000"
fi

chown -R node:node /home/node
exec su-exec node node ./src/www
