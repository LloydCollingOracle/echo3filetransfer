/* 
 * This file is part of the Echo Web Application Framework (hereinafter "Echo").
 * Copyright (C) 2002-2008 NextApp, Inc.
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 */

package nextapp.echo.filetransfer.testapp.testscreen;

import java.io.IOException;
import java.io.OutputStream;

import nextapp.echo.app.ApplicationInstance;
import nextapp.echo.app.Button;
import nextapp.echo.app.Column;
import nextapp.echo.app.event.ActionEvent;
import nextapp.echo.app.event.ActionListener;
import nextapp.echo.filetransfer.app.DownloadCommand;
import nextapp.echo.filetransfer.app.DownloadProvider;

/**
 * A test for the {@link DownloadCommand}.
 */
public class DownloadCommandTest extends Column {

	public DownloadCommandTest() {
		super();
		
		setStyleName("TestControlsColumn");

		Button button = new Button("Download sample text file");
		button.setStyleName("Default");
		button.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				doDownload();
			}
		});
		
		add(button);
	}

	private void doDownload() {
		ApplicationInstance.getActive().enqueueCommand(
				new DownloadCommand(new TestFileDownloadProvider(), false));
	}

	public static class TestFileDownloadProvider implements DownloadProvider {

		private static byte[] contents = new String(
				"Here is some test file content").getBytes();

		public String getContentType() {
			return "text/plain";
		}

		public String getFileName() {
			return "TestFile.txt";
		}

		public int getSize() {
			return contents.length;
		}

		public void writeFile(OutputStream out) throws IOException {
			out.write(contents);
		}

	}
}
