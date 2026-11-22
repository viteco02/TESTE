import {Config} from '@remotion/cli/config';
Config.setBrowserExecutable('/usr/bin/google-chrome');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(94);
Config.setConcurrency(2);
Config.setChromiumOpenGlRenderer('angle');
