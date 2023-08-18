#!/bin/sh

[[ ! -z "${USER_UID}" ]] && usermod -u ${USER_UID} node || echo "No USER_UID specified, leaving 1000"

if [[ -n "${USER_GID}" ]]
then
    GROUP_NAME=$(getent group "${USER_GID}" | cut -d ':' -f 1)
    echo "Group name: ${GROUP_NAME}"
    if [[ -n "${GROUP_NAME}" && "${GROUP_NAME}" != "node" ]]
    then
        echo "Deleting container's conflicting group: ${GROUP_NAME}"
        groupdel "${GROUP_NAME}" --force
    fi
    groupmod -g "${USER_GID}" node || echo "Problem with changing USER_GID, leaving 1000"
else
    echo "No USER_GID specified, leaving 1000"
fi

chown -R node:node /home/node
exec su-exec node node ./src/www
