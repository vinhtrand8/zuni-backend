#!/bin/bash

TESTNAME=$1

yarn mocha src/utils/zuni-crypto-library --recursive --require ts-node/register -g "$TESTNAME"