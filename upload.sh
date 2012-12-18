#!/bin/bash
tar cvfz reversible.tar.gz .
scp reversible.tar.gz stevetuckner@stewdle.com:/home/stevetuckner/reversible.stewdle.com
ssh stevetuckner@stewdle.com 'cd reversible.stewdle.com; tar xzvf reversible.tar.gz'
