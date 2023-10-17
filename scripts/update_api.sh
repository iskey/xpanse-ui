#!/bin/sh

echo ""
echo "Please make sure that you have already updated the src/xpanse-api/api.json."
echo ""
echo -n "Press any key to continue..."
read answer

# Get the directory of the currently running script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Get the root directory of xpanse-ui
API_DIR=${SCRIPT_DIR}/../src/xpanse-api/


$(
cd ${API_DIR}

# Generate API files
npx openapi-typescript-codegen --input api.json --output ./generated --exportSchemas false

FILE_NEED_ADD_LICENSE=$(grep -L "SPDX-License-Identifier" ./ --exclude *.json -R)

for FILE in $FILE_NEED_ADD_LICENSE
do
	echo $FILE
	sed -i '1s#^#/*\n * SPDX-License-Identifier: Apache-2.0\n * SPDX-FileCopyrightText: Huawei Inc.\n */\n\n#' $FILE
done
)

npx prettier --config .prettierrc --write .
