# Used by `sam build` (Metadata.BuildMethod: makefile in template.yaml).
#
# The real build already happened — `npm run build:backend` bundles every
# Lambda function with esbuild into dist-lambda/*.js, self-contained
# (including @pitch/shared, which sam build's own npm install can't
# resolve since it's an unpublished workspace package). Each target here
# just copies the matching pre-built bundle into SAM's artifacts dir.

build-LobbyFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	cp dist-lambda/lobby.js "$(ARTIFACTS_DIR)/"

build-StatsFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	cp dist-lambda/stats.js "$(ARTIFACTS_DIR)/"

build-ConnectFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	cp dist-lambda/onConnect.js "$(ARTIFACTS_DIR)/"

build-DisconnectFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	cp dist-lambda/onDisconnect.js "$(ARTIFACTS_DIR)/"

build-BidFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	cp dist-lambda/bid.js "$(ARTIFACTS_DIR)/"

build-ChooseTrumpFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	cp dist-lambda/chooseTrump.js "$(ARTIFACTS_DIR)/"

build-PlayCardFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	cp dist-lambda/playCard.js "$(ARTIFACTS_DIR)/"

build-StartNextRoundFunction:
	mkdir -p "$(ARTIFACTS_DIR)"
	cp dist-lambda/startNextRound.js "$(ARTIFACTS_DIR)/"
