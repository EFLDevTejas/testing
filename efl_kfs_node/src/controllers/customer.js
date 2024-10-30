const db = require("../models");
const sql = require('mssql');
const axios = require('axios');
const { Document, Paragraph, TextRun, Header, AlignmentType, Packer,HeightRule , HeadingLevel, Table, TableRow, TableCell, WidthType, TableLayoutType } = require('docx');
const fs = require("fs");
const path = require("path");
const oracledb = require('oracledb');
const {template} = require('../../template')

const getKFSApplicantQuery = async (appNo) => {
    const applicationNo = appNo;
    let result = {};
    const config = {  //config to connect DASHBOARD database
      server:"192.168.1.53",
      user: 'SSIS_USER',
      password: "Efl!2023@",
      database: "CustomerApp",
      options: {
        trustServerCertificate: true // Change this according to your server configuration
      }
    };
    try {
      let connection = await sql.connect(config);
       
        let applicantDetails = await connection.request()
        .input('applicationNo', sql.VarChar, applicationNo) // Define the input parameter
        .query('SELECT * FROM TBL_KFS_BASE_DTLs (NOLOCK) WHERE APPLICATION_NUMBER = @applicationNo');
        
        if(applicantDetails.recordset[0]){
          let applicantRepaymentDetails = await connection.request()
          .input('applicationNo', sql.VarChar, applicationNo) // Define the input parameter
          .query('SELECT * FROM TBL_REPAYMENT_DTLs (NOLOCK) WHERE APPLICATION_NUMBER = @applicationNo order by APPLICATION_NUMBER');
          let applicantCharges = await connection.request()
          .input('applicationNo', sql.VarChar, applicationNo) // Define the input parameter
          .query('SELECT * FROM TBL_CHARGES_DTLs (NOLOCK) WHERE APPLICATION_NUMBER = @applicationNo order by APPLICATION_NUMBER');
  
  
            const KFSResult = {
                applicant: applicantDetails.recordset,
                repaymentDetails: applicantRepaymentDetails.recordset,
                charges: applicantCharges.recordset
            }
           
           result = {
                isSuccess: true,
                message: 'success',
                statusCode: 200,
                result: KFSResult
            }
        } else {
            result = {
                isSuccess: false,
                message: 'This Applicant is not found',
                statusCode: 400
            }
        }
  
    } catch (error) {
      
        result = {
            isSuccess: false,
            message: error,
            statusCode: 500,
            result: error
        }
    }
    return result;
  }
  
  exports.generateWordKFS = async (req, res) => {
    try {
      const applicationNo = req.params.APPLICATION_NUMBER.trim();
      let KFS_RESULT = '';
      
      KFS_RESULT = await getKFSApplicantQuery(applicationNo);
      
      if(KFS_RESULT.isSuccess){
        applicant = KFS_RESULT.result.applicant[0]
        repaymentDetails = KFS_RESULT.result.repaymentDetails
        charge = KFS_RESULT.result.charges
    let headers = new TableRow({
      children: [
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          width: { size: 20, type: WidthType.PERCENTAGE },
          children:  [new Paragraph({ children: [
            new TextRun({ text: "Instalment No.",size: 26,bold: true}),
          ],alignment: AlignmentType.CENTER })  ],
        }),
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          width: { size: 20, type: WidthType.PERCENTAGE },
          children:  [new Paragraph({ children: [new TextRun({ text: "Outstanding Principal (in Rupees)",size: 26,bold:true})], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [
            new TextRun({ text: "Principal (in Rupees)",size: 26, bold: true})
          ], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [
            new TextRun({ text: "Interest (in Rupees)",size: 26, bold: true})
          ], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [
            new TextRun({ text: "Instalment (in Rupees)",size: 26, bold: true})
          ], alignment: AlignmentType.CENTER })],
        })
      ],
      height: { value: 300, rule: HeightRule.ATLEAST }
    })
    
  
    const rows = repaymentDetails.map(rowData => new TableRow({
        children: [
          new TableCell({
            margins: {
              left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
            },
            width: { size: 20, type: WidthType.PERCENTAGE },
            children:  [new Paragraph({ children: [
              new TextRun({ text: `${rowData.INSTALLMENT_NUMBER}`,size: 26}),
            ],alignment: AlignmentType.CENTER })  ],
          }),
          new TableCell({
            margins: {
              left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
            },
            width: { size: 20, type: WidthType.PERCENTAGE },
            children:  [new Paragraph({ children: [new TextRun({ text: `${rowData.OPENINGBALANCE}`,size: 26})], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            margins: {
              left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
            },
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [
              new TextRun({ text: `${rowData.PRINCIPALAMOUNT}`,size: 26})
            ], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            margins: {
              left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
            },
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [
              new TextRun({ text: `${rowData.INTERESTAMOUNT}`,size: 26})
            ], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            margins: {
              left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
            },
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [
              new TextRun({ text: `${rowData.INSTALMENT}`,size: 26})
            ], alignment: AlignmentType.CENTER })],
          })
        ],
          height: { value: 300, rule: HeightRule.ATLEAST }
      }))
  
    const charges = charge.map(rowdata => new TableRow({
      children: [
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          columnSpan: 1,
          width: { size: 10, type: WidthType.PERCENTAGE },
          children:  [new Paragraph({ text: "(i)", size: 28 })],
        }),
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          columnSpan: 2,
          children: [new Paragraph({ text: `${rowdata.CHARGE_NAME ? rowdata.CHARGE_NAME : ""}`, size: 28 })],
        }),
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          children: [new Paragraph({ text: `${rowdata.ONE_TIME_RE ? rowdata.ONE_TIME_RE : "One Time"}`, size: 28 })],
        }),
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          children: [new Paragraph({ text: `${rowdata.PAYABLE_TO_RE ? rowdata.PAYABLE_TO_RE : ""}`, size: 28 })],
        }),
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          children: [new Paragraph({ text: `${rowdata.ONE_TIME_THIRD_PARTY ? rowdata.ONE_TIME_THIRD_PARTY : "One Time"}`, size: 28 })],
        }),
        new TableCell({
          margins: {
            left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
          },
          columnSpan: 2,
          children: [new Paragraph({ text: `${rowdata.PAYABLE_TO_THIRD_PARTY ? rowdata.PAYABLE_TO_THIRD_PARTY : ""}`, size: 28 })]
        }),
      ],
      height: { value: 300, rule: HeightRule.ATLEAST }
    }))  
  
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,   // 0.5 inch margin (720 twips)
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Header
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Annex A", bold: true, color: "808080", size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Key Facts Statement", bold: true, size: 28 })],
            spacing: {before: 300}
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Part 1 (Interest rate and fees/charges)", bold: true, size: 28 })],
            spacing: {before: 300, after: 400}
          }),
         
  
          // Table for the details
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "1", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children:  [new Paragraph({ children: [new TextRun({ text: "Loan proposal/ account No.", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [new Paragraph(`${applicant.APPLICATION_NUMBER ? applicant.APPLICATION_NUMBER : ""}`)],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children: [new Paragraph({ children: [new TextRun({ text: "Type of Loan", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [new Paragraph(`${applicant.TYPE_OF_LOAN ? applicant.TYPE_OF_LOAN : ""}`)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "2", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 4,
                    children: [new Paragraph({ children: [new TextRun({ text: "Sanctioned Loan amount (in Rupees)", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 3,
                    children: [new Paragraph(`₹. ${applicant.SANCTION_AMOUNT ? applicant.SANCTION_AMOUNT : ""}`)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "3", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 4,
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Disbursal schedule", bold: true }),
                        new TextRun({ text: "(i) Disbursement in stages or 100% upfront.",break: 1 }),
                        new TextRun({ text: "(ii) If it is stage-wise, mention the clause of loan agreement having relevant details.",break: 1 }),
                      ],
                    })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 3,
                    children: [new Paragraph("")],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "4", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 4,
                    children: [new Paragraph({ children: [new TextRun({ text: "Loan term (year/months/days)", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 3,
                    children: [new Paragraph(`${applicant.TENURE ? applicant.TENURE : 0} Months`)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "5", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 7,
                    children: [new Paragraph({ children: [new TextRun({ text: "Instalment details", bold: true })] })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children:[new Paragraph({ text: "Type of instalments", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    children: [new Paragraph({ text: "Number of EPIs", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    width: { size: 17, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "EPI (₹)", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 3,
                    children: [new Paragraph({ children: [new TextRun({ text: "Commencement of repayment, post sanction", size: 20,color: "FF0000" })] })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    width: { size: 20, type: WidthType.PERCENTAGE },
                     children: [new Paragraph(`${applicant.INSTALLMENT_TYPE ? applicant.INSTALLMENT_TYPE : ""}`)],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                     children: [new Paragraph(`${applicant.NUMBER_OF_EPIS ? applicant.NUMBER_OF_EPIS : ""}`)],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                     children: [new Paragraph(`${applicant.EPI ? applicant.EPI : ""}`)],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 3,
                     children: [new Paragraph(``)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "6", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 4,
                    children: [new Paragraph({ children: [new TextRun({ text: "Interest rate (%) and type (fixed or floating or hybrid)", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 3,
                    children: [new Paragraph(`${applicant.RATE ? applicant.RATE + " " + applicant.RATE_TYPE : ""}`)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "7", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 7,
                    children: [new Paragraph({ children: [new TextRun({ text: "Additional Information in case of Floating rate of interest", bold: true })] })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    rowSpan: 2,
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:[new Paragraph({ text: "Reference Benchmark", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    rowSpan: 2,
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "Benchmark rate (%) (B)", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    rowSpan: 2,
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "Spread (%) (S)", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    rowSpan: 2,
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Final rate (%)", size: 28 }),
                          new TextRun({ text: "R = (B) + (S)", size: 18, break: 1 }), // Line break
                        ],
                      })
                    ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    // children: [new Paragraph({ children: [
                    //   new TextRun({ text: "Fee/ Charges", bold: true }),
                    //   new TextRun({
                    //     text: "4", // Superscript character
                    //     size: 20,
                    //     superScript: true, // Set this to true for superscript
                    //   })] })]
                    children: [new Paragraph({children: [
                      new TextRun({text: "Reset periodicity", size: 20,color: "FF0000"}),
                      new TextRun({
                        text: "2", // Superscript character
                        size: 20,
                        superScript: true, // Set this to true for superscript
                        color: "FF0000"
                      }),
                      new TextRun({text: "(Months)", size: 20,color: "FF0000"})
                    ]}),],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph({ text: "Impact of change in the reference benchmark (for 25 bps change in ‘R’, change in:", size: 28 })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:[new Paragraph({ text: "B", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "S", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "EPI (₹)", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "No. of EPIs", size: 28 })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:[new Paragraph({ text: "N/A", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "N/A", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "N/A", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "N/A", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "N/A", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "N/A", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    children: [new Paragraph({ text: "N/A", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    children: [new Paragraph({ text: "N/A", size: 28 })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "8", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 7,
                    children: [new Paragraph({ children: [
                      new TextRun({ text: "Fee/ Charges", bold: true }),
                      new TextRun({
                        text: "4", // Superscript character
                        size: 20,
                        superScript: true, // Set this to true for superscript
                      })] })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 3,
                    children: [new Paragraph("")],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph({ text: "Payable to the RE (A)", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 3,
                    children: [new Paragraph({ text: "Payable to a third party through RE (B)", size: 28 })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 1,
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph("")],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph("")],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    children: [new Paragraph({ text: "One-time / Recurring", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Amount (in ₹) or Percentage (%) as applicable", size: 20 }),
                        new TextRun({
                          text: "5", // Superscript character
                          size: 20, // Smaller size to simulate superscript
                          superScript: true, // Not directly supported, hence use size adjustments
                        }),
                      ],
                    }),],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    children: [new Paragraph({ text: "One-time / Recurring", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Amount (in ₹) or Percentage (%) as applicable", size: 20 }),
                        new TextRun({
                          text: "5", // Superscript character
                          size: 20, // Smaller size to simulate superscript
                          superScript: true, // Not directly supported, hence use size adjustments
                        }),
                      ],
                    }),],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              ...charges,
              // new TableRow({
              //   children: [
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 1,
              //       width: { size: 10, type: WidthType.PERCENTAGE },
              //       children:  [new Paragraph({ text: "(i)", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 2,
              //       children: [new Paragraph({ text: "Processing fees", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 2,
              //       children: [new Paragraph({ text: "", size: 28 })]
              //     }),
              //   ],
              //   height: { value: 300, rule: HeightRule.ATLEAST }
              // }),11
              // new TableRow({
              //   children: [
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 1,
              //       width: { size: 10, type: WidthType.PERCENTAGE },
              //       children:  [new Paragraph({ text: "(ii)", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 2,
              //       children: [new Paragraph({ text: "Insurance charges", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 2,
              //       children: [new Paragraph({ text: "", size: 28 })]
              //     }),
              //   ],
              //   height: { value: 300, rule: HeightRule.ATLEAST }
              // }),
              // new TableRow({
              //   children: [
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 1,
              //       width: { size: 10, type: WidthType.PERCENTAGE },
              //       children:  [new Paragraph({ text: "(iii)", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 2,
              //       children: [new Paragraph({ text: "Valuation fee", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 2,
              //       children: [new Paragraph({ text: "", size: 28 })]
              //     }),
              //   ],
              //   height: { value: 300, rule: HeightRule.ATLEAST }
              // }),
              // new TableRow({
              //   children: [
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 1,
              //       width: { size: 10, type: WidthType.PERCENTAGE },
              //       children:  [new Paragraph({ text: "(iv)", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 2,
              //       children: [new Paragraph({ text: "Any other (please specify)", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       children: [new Paragraph({ text: "", size: 28 })],
              //     }),
              //     new TableCell({
              //       margins: {
              //         left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
              //       },
              //       columnSpan: 2,
              //       children: [new Paragraph({ text: "", size: 28 })]
              //     }),
              //   ],
              //   height: { value: 300, rule: HeightRule.ATLEAST }
              // }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 1,
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "9", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 3,
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Annual Percentage Rate (APR) (%)", size: 20,color: "FF0000", }),
                        new TextRun({
                          text: "6", // Superscript character
                          size: 20, // Smaller size to simulate superscript
                          superScript: true, // Not directly supported, hence use size adjustments
                          color: "FF0000",
                        }),
                      ],
                    }),],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    children: [new Paragraph({ text: "", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    children: [new Paragraph({ text: "", size: 28 })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph({ text: "", size: 28 })]
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "10", bold: true })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 7,
                    children:  [new Paragraph({ children: [new TextRun({ text: "Details of Contingent Charges (in ₹ or %, as applicable)", size: 20,color: "FF0000" })] })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "(i)"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 5,
                    children: [new Paragraph({ children: [new TextRun({ text: "Penal charges, if any, in case of delayed payment"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph(`${applicant.PENAL_CHARGES ? applicant.PENAL_CHARGES : ""}`)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "(ii)"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 5,
                    children: [new Paragraph({ children: [new TextRun({ text: "Other penal charges, if any"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph(`${applicant.OTHER_PENAL_CHARGES ? applicant.OTHER_PENAL_CHARGES : ""}`)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "(iii)"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 5,
                    children: [new Paragraph({ children: [new TextRun({ text: "Foreclosure charges, if applicable"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph(`${applicant.FORECLOSURE_CHARGES ? applicant.FORECLOSURE_CHARGES : ""}`)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "(iv)"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 5,
                    children: [new Paragraph({ children: [new TextRun({ text: "Charges for switching of loans from floating to fixed rate and vice verse"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph(`${applicant.CHARGES_FOR_SWITCHING_OF_LOANS ? applicant.CHARGES_FOR_SWITCHING_OF_LOANS : ""}`)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "(v)"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 5,
                    children: [new Paragraph({ children: [new TextRun({ text: "Bank Change/Cheque/NACH/ECS swapping"})] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: 2,
                    children: [new Paragraph(`${applicant.BANK_CHARGES ? applicant.BANK_CHARGES : ""}`)],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
           
              
            ],
          }),
  
          ///second page --------------------------------
          new Paragraph({
            pageBreakBefore: true,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Part 2 (Other qualitative information)", bold: true, size: 28 })],
            spacing: {before: 300,after: 200}
          }),
  
          new Table({
            rows: [
              new TableRow({
              children: [
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [new TextRun({ text: "1", size: 24 })] })],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  columnSpan: "2",
                  children:  [new Paragraph({ children: [
                    new TextRun({ text: "Clause of Loan agreement relating to",size: 24}),
                    new TextRun({ text: "engagement of recovery agents", size: 24, break:1 })
                  ] })],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  columnSpan : "2",
                  children: [new Paragraph("")],
                })
              ],
              height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "2", size: 24 })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    columnSpan : "2",
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "Clause of Loan agreement which details", size: 24 }),
                      new TextRun({ text: "grievance redressal mechanism", size: 24,break:1 })
                    ] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan : "2",
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    children: [new Paragraph("")],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "3", size: 24 })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    columnSpan : "2",
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "Phone number and email id of the nodal", size: 24 }),
                      new TextRun({ text: "grievance redressal officer", size: 24, break:1 }),
                      new TextRun({ text: "7", size: 24, superScript: true }),
                    ] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    columnSpan : "2",
                    children: [new Paragraph("")],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "4", size: 24 })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    columnSpan : "2",
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "Whether the loan is, or in future maybe, subject", size: 24 }),
                      new TextRun({ text: "to transfer to other REs or securitisation (Yes/ No)", size: 24,break:1 })
                    ] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan : "2",
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    children: [new Paragraph("YES")],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "5", size: 24 })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: "4",
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "In case of lending under collaborative lending arrangements (e.g., co-lending/ outsourcing),", size: 24 }),
                      new TextRun({ text: "following additional details may be furnished:", size: 24,break:1 })
                    ] })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE }, // Ensure full table width is set
          layout: TableLayoutType.FIXED,
          }),
          new Table({
            rows: [
              new TableRow({
              children: [
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  columnSpan : "2",
                  children:  [
                    new Paragraph({ children: [new TextRun({ text: "Name of the originating RE, along", size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: "with its funding proportion", size: 20, break: 1 })] })
                  ],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [
                    new TextRun({ text: "Name of the partner RE along with its",size: 20}),
                    new TextRun({ text: "proportion of funding", size: 20, break:1 })
                  ] })],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({text: "Blended rate of interest", size: 20})],
                })
              ],
              height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    columnSpan: "2",
                    children:  [new Paragraph("N/A")],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph("N/A")],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    children: [new Paragraph("N/A")],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "6", size: 24 })] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: "4",
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "In case of digital loans, following specific disclosures may be furnished:", size: 24 })
                    ] })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    columnSpan: "3",
                    children:  [new Paragraph({ 
                      indent: {
                        left: 540, // 720 TWIPs = 0.5 inch = approx 30px
                      },
                      children: [
                      new TextRun({ text: "(i)  Cooling off/look-up period, in terms of RE’s board", size: 24}),
                      new TextRun({ text: "      approved policy, during which borrower shall", size: 24,break:1 }),
                      new TextRun({ text: "      not be charged any penalty on", size: 24, break: 1 }),
                      new TextRun({ text: "      prepayment of loan", size: 24, break: 1 }),
                    ] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: "2",
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "3 Days", size: 24 })
                    ] })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    columnSpan: "3",
                    children:  [new Paragraph({ 
                      indent: {
                        left: 540, // 720 TWIPs = 0.5 inch = approx 30px
                      },
                      children: [
                      new TextRun({ text: "(ii)  Details of LSP acting as recovery agent and", size: 24}),
                      new TextRun({ text: "      approved policy, during which borrower shall", size: 24,break:1 })
                    ] })],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    columnSpan: "2",
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "", size: 24 })
                    ] })],
                  }),
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }, // Ensure full table width is set
            layout: TableLayoutType.FIXED,
          }),    
  
          //third page -----------------------
          new Paragraph({
            pageBreakBefore: true,
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Annex B", bold: true, color: "808080", size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Illustration for computation of APR for Retail and MSME loans", bold: true, size: 28 })],
            spacing: {before: 300,after: 200}
          }),
  
          new Table({
            rows: [
              new TableRow({
              children: [
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [
                    new TextRun({ text: "Sr.",size: 26,bold: true}),
                    new TextRun({ text: "No.", size: 26,bold:true, break:1 })
                  ], alignment: AlignmentType.CENTER })  ],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [new TextRun({ text: "Parameter",size: 26,bold: true})], alignment: AlignmentType.CENTER })],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: "Details",size: 26,bold: true})], alignment: AlignmentType.CENTER })],
                })
              ],
              height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
              children: [
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [
                    new TextRun({ text: "1",size: 26}),
                  ],alignment: AlignmentType.CENTER })  ],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [new TextRun({ text: "Sanctioned Loan amount (in Rupees) (Sl no. 2 of the KFS template - Part 1)",size: 26})], alignment: AlignmentType.LEFT })],
                }),
                new TableCell({
                  margins: {
                    right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: `${applicant.SANCTION_AMOUNT ? applicant.SANCTION_AMOUNT : ""}`,size: 26})], alignment: AlignmentType.RIGHT })],
                })
              ],
              height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
              children: [
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [
                    new TextRun({ text: "2",size: 26}),
                  ],alignment: AlignmentType.CENTER })  ],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [new TextRun({ text: "Loan Term (in years/ months/ days) (Sl No.4 of the KFS template - Part 1)",size: 26})], alignment: AlignmentType.LEFT })],
                }),
                new TableCell({
                  margins: {
                    right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: `${applicant.TENURE ? applicant.TENURE + "Months" : ""}`,size: 26})], alignment: AlignmentType.RIGHT })],
                })
              ],
              height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
              children: [
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [
                    new TextRun({ text: "a)",size: 26}),
                  ],alignment: AlignmentType.CENTER })  ],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [new TextRun({ text: "No. of instalments for payment of principal, in case of non- equated periodic loans",size: 26})], alignment: AlignmentType.LEFT })],
                }),
                new TableCell({
                  margins: {
                    right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: "",size: 26})], alignment: AlignmentType.RIGHT })],
                })
              ],
              height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
              children: [
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [
                    new TextRun({ text: "b)",size: 26}),
                  ],alignment: AlignmentType.CENTER })  ],
                }),
                new TableCell({
                  margins: {
                    left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children:  [new Paragraph({ children: [
                    new TextRun({ text: "Type of EPI",size: 26}),
                    new TextRun({ text: "Amount of each EPI (in Rupees) and",size: 26, break : 1}),
                    new TextRun({ text: "nos. of EPIs (e.g., no. of EMIs in case of monthly ",size: 26, break : 1}),
                    new TextRun({ text: "instalments)",size: 26, break : 1}),
                    new TextRun({ text: "(Sl No. 5 of the KFS template – Part 1))",size: 26, break : 1})], alignment: AlignmentType.LEFT })
                  ]
                }),
                new TableCell({
                  margins: {
                    right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                  },
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [
                    new TextRun({ text: `${applicant.LOAN_TERMS ? applicant.LOAN_TERMS : ""}`,size: 26}),
                    new TextRun({ text: `${applicant.EPI ? applicant.EPI : ""}`,size: 26, break : 1}),
                    new TextRun({ text: `${applicant.NUMBER_OF_EPIS ? applicant.NUMBER_OF_EPIS : ""}`,size: 26, break : 1})
                  ], alignment: AlignmentType.RIGHT })],
                })
              ],
              height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "c)",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "No. of instalments for payment of capitalised interest, if any ", color: "FF6666",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "N/A",size: 26})], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "d)",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Commencement of repayments, post sanction (Sl No. 5 of the KFS template - Part 1)", color: "FF6666",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "",size: 26})], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "3",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Interest rate type (fixed or floating or hybrid) (Sl No. 6 of the KFS template - Part 1)",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: `${applicant.RATE_TYPE ? applicant.RATE_TYPE : ""}`,size: 26})], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "4",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Rate of Interest  (Sl No. 6 of the KFS template – Part 1)",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: `${applicant.RATE ? applicant.RATE : ""}`,size: 26})], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "5",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Total Interest Amount to be charged during the entire tenor of the loan as per the rate prevailing on sanction date (in Rupees)",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: `${applicant.TOTALINTERESTAMOUNT ? applicant.TOTALINTERESTAMOUNT : ""}`,size: 26})], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "6",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Fee/ Charges payable8 (in Rupees)",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: `${applicant.FEES ? applicant.FEES : ""}`,size: 26})], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "A",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Payable to the RE (Sl No.8A of the KFS template-Part 1)",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: `${applicant.PAYABLE_TO_RE ? applicant.PAYABLE_TO_RE : ""}`,size: 26})], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "B",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Payable to third-party routed through RE (Sl No.8B of the KFS template - Part 1)",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: `${applicant.PAYABLE_TO_THIRD_PARTY ? applicant.PAYABLE_TO_THIRD_PARTY : ""}`,size: 26})], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "7",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Net disbursed amount (1-6) (in Rupees)",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: `${applicant.NET_DISBURSED_AMT ? applicant.NET_DISBURSED_AMT : ""}`,size: 26})], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "8",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Total amount to be paid by the borrower (sum of 1 and 5) (in Rupees)",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [
                      new TextRun({ text: `${applicant.TOTAL_AMT_PAID_BY_BORROWER ? applicant.TOTAL_AMT_PAID_BY_BORROWER : ""}`,size: 26})
                    ], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "9",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Annual Percentage rate- Effective annualized interest rate (in percentage)10 (Sl No.9 of the KFS template-Part 1)",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [
                      new TextRun({ text: "",size: 26})
                    ], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "10",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Schedule of disbursement as per terms and conditions",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [
                      new TextRun({ text: "",size: 26})
                    ], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
              new TableRow({
                children: [
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [
                      new TextRun({ text: "11",size: 26}),
                    ],alignment: AlignmentType.CENTER })  ],
                  }),
                  new TableCell({
                    margins: {
                      left: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children:  [new Paragraph({ children: [new TextRun({ text: "Due date of payment of instalment and interest",size: 26})], alignment: AlignmentType.LEFT })],
                  }),
                  new TableCell({
                    margins: {
                      right: 100, // Set left padding (in TWIPs, 1 TWIP = 1/1440 inch)
                    },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [
                      new TextRun({ text: `${applicant.FIRST_INSTALLMENT_DATE ? applicant.FIRST_INSTALLMENT_DATE : ""}`,size: 26})
                    ], alignment: AlignmentType.RIGHT })],
                  })
                ],
                height: { value: 300, rule: HeightRule.ATLEAST }
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }, // Ensure full table width is set
            layout: TableLayoutType.FIXED,
          }),
          
          //fourth page ----------------
          new Paragraph({
            pageBreakBefore: true,
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Annex C", bold: true, color: "808080", size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Illustrative Repayment Schedule under Equated Periodic Instalment for the hypothetical loan illustrated in Annex B", bold: true, size: 28 })],
            spacing: {before: 300,after: 200}
          }),
  
          new Table({
            rows : [
              headers,
              ...rows
            ]
          })
        ],
      },
    ],
  });
      // console.log(htmlContent, "htmlContent");
  
      // Convert the HTML content to a .docx buffer
      const filePath = path.join("D:\\KFS APP\\efl_kfs_node\\assets", "SampleDocument.docx");
  
      // const docxBlob = htmlDocx.asBlob(htmlContent);
      // Convert Blob to Buffer
      // const docxBuffer = await blobToBuffer(docxBlob);
  
      const buffer = await Packer.toBuffer(doc);
      // console.log("docxBuffer", docxBuffer);
  
      // Write the buffer to a .docx file
      // fs.writeFileSync(filePath, docxBuffer);
      fs.writeFileSync(filePath, buffer);
      res.setHeader('Content-Disposition', `attachment; filename=${applicationNo + "_KFS.docx"}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  
      // Send the file to the frontend
      res.status(200).sendFile(filePath);
  }else{
      res.status(KFS_RESULT.statusCode).send(KFS_RESULT);
  }
    } catch (e) {
      console.log(e);
  
    }
  }
  
  
  
  
  exports.oracleConnection = async(req,res) => {
    let connection;
    let  applicationNumber = 'APPL00000002';
    try {
      const config = {
        user: process.env.USER,
        password: process.env.PASSWORD,
        // connectString: 'finnone-db.cqsf7yfx6tjv.ap-south-1.rds.amazonaws.com:1521/ORCL' // Adjust this to your database connection string
        connectString: process.env.CONNECTION_STRING // Adjust this to your database connection string
      }
      connection = await oracledb.getConnection(config);
  
      console.log('Successfully connected to Oracle Database');
  
      // Example query
    const _REPAYMENTSCHEDULERESULT = await connection.execute(`
        SELECT m.application_number, Installment_Number, Due_Date, OpeningBalance, PrincipalAmount, InterestAmount, Instalment 
        FROM (
          SELECT application_number,
                 TO_NUMBER("installmentNo") AS Installment_Number,
                 "openingBalance" AS OpeningBalance,
                 "principalAmount" AS PrincipalAmount,
                 "interestAmount" AS InterestAmount,
                 "InstallmentAmount" AS Instalment,
                 TO_CHAR(TO_DATE('01-01-1970', 'dd-mm-yyyy') + NUMTODSINTERVAL(ROUND(("installmentDate" / 1000) / (60 * 60 * 24)), 'DAY'), 'DD-MM-YYYY') AS Due_Date,
                 TO_CHAR(rs.INTREST_START_DAY, 'dd-mm-yyyy') AS INTREST_START_DATE,
                 TO_CHAR(TO_DATE('01-01-1970', 'dd-mm-yyyy') + NUMTODSINTERVAL(ROUND(("installmentDate" / 1000) / (60 * 60 * 24)), 'DAY'), 'DD-MM-YYYY') AS MATURITYDATE
          FROM EFL_NEO_CAS_LMS.loan_Application A
          LEFT JOIN (
            SELECT application_fk, repayment_schedule
            FROM (
              SELECT application_fk, repayment_schedule,
                     ROW_NUMBER() OVER (PARTITION BY application_fk ORDER BY repayment_schedule DESC) rnk
              FROM EFL_NEO_CAS_LMS.SUB_LOAN
            ) a
            WHERE rnk = 1
          ) SL ON a.id = sl.application_fk
          LEFT OUTER JOIN EFL_NEO_CAS_LMS.repayment_schedule rs ON sl.repayment_schedule = rs.id,
          JSON_TABLE(NATIVE_RESPONSE, '$.coreRepaymentScheduleDetailDTOList[*]'
            COLUMNS (
              "installmentNo" PATH '$.installmentNo', 
              "installmentDate" PATH '$.installmentDate',
              "InstallmentAmount" PATH '$.equatedInstallmentAmount',
              "openingBalance" PATH '$.openingBalance',
              "principalAmount" PATH '$.principalAmount',
              "interestAmount" PATH '$.interestAmount'
            )
          ) "J"
        ) m
        WHERE m.application_number = '${applicationNumber}'
      `,
      [],  // Optional: Bind parameters if needed
      { outFormat: oracledb.OBJECT } 
    );
    const _MAINQUERYRESULT = await connection.execute(
      `SELECT DISTINCT a.APPLICATION_NUMBER,
        CASE 
          WHEN SCHEME_NAME IN ('AFL Balance Transfer', 'AFL Term Loan', 'AFL Purchase', 'AFL Top Up', 
                               'MSBL Term Loan', 'SBL Balance Transfer', 'SBL Term Loan', 'MSBL Topup', 
                               'SBL Topup', 'MSBL Balance Transfer') THEN 'Property Loan'
          WHEN SCHEME_NAME = 'EEL_Solar' THEN 'Solar Loan'
          WHEN SCHEME_NAME = 'Pragati' THEN 'Business Loan'
          WHEN SCHEME_NAME = 'EEL_UNSEC' THEN 'Unsecured Business Loan'
          WHEN scheme_code IN ('SBFBLTP1', 'BLCEFSEC', 'SBFBLSEC', 'BLREFSEC', 'BLEEFSEC') THEN 'Business Loan'
          WHEN scheme_code IN ('ECLGSEEF', 'ECLGSREF', 'ECLGSCEF', 'ECLGSSBF', 'ECLGSRE') THEN 'ECLGS Loan'
          WHEN scheme_code IN ('CORPPRO1', 'CORPLAP1', 'SBFPLBT1', 'SBFBLLP1') THEN 'Loan against Property'
          WHEN scheme_code IN ('SBFBLMA1', 'SBFBL', 'Core_SBF', 'CORPBLM1', 'CORPOML1', 'CORPREF1', 'CEFLEASE',
                               'EEFMLLS1', 'EEFMLSI1', 'EEFMLRN1', 'EEFMLHP1', 'EEFBLEC1', 'EEFMLTL1', 'EEFBLSB1',
                               'EEFBLTP1', 'EEFBLES1', 'EEFBLBT1', 'CEFBLBT1', 'CEFBLSB1', 'CEFBLTP1', 'CEFMLHP1',
                               'CEFBLEC1', 'CEFBLES1', 'CEFMLLS1', 'CEFMLRN1', 'CEFMLSI1', 'CEFMLTL1', 'SMFSEC',
                               'SMFSECL') THEN 'Machine Purchase Loan'
          WHEN scheme_code IN ('SLAPNEW1', 'SLAPEXI1') THEN 'Property Purchase Loan'
          WHEN scheme_code IN ('REFRTSP1', 'REFRTSS1', 'REFRTSR1', 'COERELAP', 'CoreREFL', 'Coreref', 'REFMLTL1', 
                               'R_Solar', 'REFRETP2', 'REFRETR2', 'REFRETP1', 'RSolar', 'REFRETR1', 'Solar1') 
            THEN 'Solar Purchase Loan'
          WHEN scheme_code IN ('TRADETL1', 'TRADEDL1') THEN 'Trade Finance'
          WHEN scheme_code IN ('EEFBLUB1', 'CEFBLUB1', 'REFUNSEC', 'CEFUNSEC', 'EEFUNSEC', 'SBFBLUnS') 
            THEN 'Unsecured Business Loan'
          WHEN scheme_code IN ('SBFBLUB1', 'SBFBLUB2', 'SBFWCDL1', 'SBFWCTL1', 'SBFBDSI1', 'SBFBDHU1', 'CORPUBL1', 
                               'WCDLUBL', 'WCTC', 'WCTLBL', 'WCDLBL') THEN 'Working capital Loan'
          ELSE (SELECT Name FROM efl_neo_cas_lms.Generic_Parameter WHERE Id = A.Loan_Application_Type)
        END AS TYPE_OF_LOAN,
        rs.SAMOUNT_BASEVALUE AS FINANCE_AMOUNT,
        sl.SANCTIONED_TENURE AS Tenure,
        (SELECT name FROM EFL_NEO_CAS_LMS.generic_parameter WHERE dtype = 'RepayPolicyInstallmentType' 
         AND code = TO_CHAR(rs.INSTALLMENT_TYPE)) AS INSTALLMENT_TYPE,
        (SELECT Name FROM efl_neo_cas_lms.Generic_Parameter WHERE Id = RS.REPAY_PAYMENT_FREQUENCY) AS loan_terms,
        RS.EMI_BASE_VALUE AS EPI,
        TO_CHAR(RS.intrest_start_day, 'DD-MON-YYYY') AS intrest_start_date,
        TO_CHAR(rs.FIRST_INSTALLMENT_DATE, 'DD-MON-YYYY') AS FIRST_INSTALLMENT_DATE,
        rs.RATE,
        (SELECT name FROM EFL_NEO_CAS_LMS.generic_parameter WHERE dtype = 'RepayPolicyRateType' 
         AND code = TO_CHAR(rs.RATE_TYPE)) AS Rate_Type,
        '36% PA calculated on daily Basis from EMI date to actual EMI receipt date' AS Penal_charges,
        '1000/- + GST' AS Other_Penal_charges,
        CASE 
          WHEN scheme_code IN ('EELSBNP1', 'EELMSTL1', 'EELMSTP1', 'EELBLBC1', 'EELMSNP1', 'EELSBTL1', 'EELSBBT1',
                               'EELSBTP1', 'EELSBBC1', 'EELJBT1', 'ETP01', 'ETL01', 'EBT01', 'EP01', 'EBC01', 
                               'Prag001', 'EELS', 'EELMSBT1', 'EELVETL1', 'EELVEBT1', 'EELUNSEC', 'JBTMSBT1',
                               'JBTSBL1', 'EELSOLAR') 
            THEN 'No Foreclosure to be done within 12 months 5% on Outstanding Principal during Month No. 13 — 24 4% 
                  on Outstanding Principal from Month No. 25 onwards'
          ELSE '5% on outstanding principal for first 12 months, 4% for 13-24 months, and 3% for 25 months onwards'
        END AS Foreclosure_charges,
        'NA' AS Charges_for_switching_of_loans,
        '750/+ GST' AS Bank_charges,
        SL.Samount_Basevalue AS SANCTION_AMOUNT,
        f.Payable_To_RE + f.Payable_To_Third_Party AS FEES,
        f.Payable_To_RE,
        f.Payable_To_Third_Party,
        rs1.TotalInterestAmount,
        SL.Samount_Basevalue - (f.Payable_To_RE + f.Payable_To_Third_Party) AS NET_DISBURSED_AMT,
        SL.Samount_Basevalue + rs1.TotalInterestAmount AS TOTAL_AMT_PAID_BY_BORROWER,
        (SELECT Name FROM efl_neo_cas_lms.Generic_Parameter WHERE Id = Ld.Loan_Disbursal_Status) AS Loan_Disbursal_Status
      FROM efl_neo_cas_lms.LOAN_APPLICATION A
      LEFT JOIN efl_neo_cas_lms.SUB_LOAN SL ON a.id = sl.application_fk
      LEFT JOIN efl_neo_cas_lms.PARTY P ON A.ID = P.LOAN_APPLICATION_FK
      LEFT JOIN efl_neo_cas_lms.CUSTOMER C ON C.ID = P.CUSTOMER
      LEFT JOIN efl_neo_cas_lms.Loan_Disbursal Ld ON Sl.Id = Ld.Subloan_Id
      LEFT JOIN EFL_NEO_CAS_LMS.repayment_schedule rs ON sl.repayment_schedule = rs.id
      LEFT JOIN efl_neo_cas_lms.loan_product p ON p.Id = Sl.Product
      LEFT JOIN efl_neo_cas_lms.Loan_Scheme ls ON ls.Id = Sl.Scheme
      LEFT JOIN (
        SELECT m.application_number, SUM(TotalInterestAmount) AS TotalInterestAmount
        FROM (
          SELECT application_number, "interestAmount" AS TotalInterestAmount
          FROM EFL_NEO_CAS_LMS.loan_Application A
          LEFT JOIN (
            SELECT application_fk, repayment_schedule 
            FROM (
              SELECT application_fk, repayment_schedule,
                     ROW_NUMBER() OVER (PARTITION BY application_fk ORDER BY repayment_schedule DESC) rnk
              FROM EFL_NEO_CAS_LMS.SUB_LOAN
              WHERE IS_PARENT_SUB_LOAN = 1
            ) a WHERE rnk = 1
          ) SL ON a.id = sl.application_fk
          LEFT JOIN EFL_NEO_CAS_LMS.repayment_schedule rs ON sl.repayment_schedule = rs.id,
               JSON_TABLE(NATIVE_RESPONSE, '$.coreRepaymentScheduleDetailDTOList[*]'
               COLUMNS("interestAmount" PATH '$.interestAmount')) "J"
        ) m
        GROUP BY application_number
      ) rs1 ON a.application_number = rs1.application_number
      LEFT JOIN (
        SELECT Sub_loan_fk, SUM(Payable_To_RE) AS Payable_To_RE, SUM(Payable_To_Third_Party) AS Payable_To_Third_Party
        FROM (
          SELECT Sub_loan_fk,
                 CASE WHEN ac.charge_code NOT IN (4611, 4644, 4622, 4625, 4667, 4605, 4617) 
                      THEN COMP_BASE_VALUE + COALESCE(tax.IGST, 0) ELSE 0 END AS Payable_To_RE,
                 CASE WHEN ac.charge_code IN (4611, 4644, 4622, 4625, 4667, 4605, 4617) 
                      THEN COMP_BASE_VALUE + COALESCE(tax.IGST, 0) ELSE 0 END AS Payable_To_Third_Party
          FROM efl_neo_cas_lms.Application_Charges ac
          LEFT JOIN (
            SELECT TAX_STRUCTURE_DETAIL, SUM(TAX_BREAK_UP_AMOUNT) AS IGST
            FROM efl_neo_cas_lms.CHARGE_TAX_STRUCTURE
            GROUP BY TAX_STRUCTURE_DETAIL
          ) tax ON aC.CURRENT_TAX_DETAIL = tax.TAX_STRUCTURE_DETAIL
          WHERE COMP_BASE_VALUE > 0
        ) fees
        GROUP BY Sub_loan_fk
      ) F ON SL.ID = F.Sub_loan_fk
      WHERE p.party_role = 0 
      AND IS_PARENT_SUB_LOAN = 1
      AND a.APPLICATION_NUMBER IN ('${applicationNumber}')
      `,
      [],  // Optional: Bind parameters if needed
      { outFormat: oracledb.OBJECT }
    );
    const _FEESRESULT = await connection.execute(
      `SELECT A.Application_Number,
              C.CHARGE_NAME,
              'One Time' AS One_Time_RE,
              CASE 
                WHEN c.charge_code IN (4602, 15035, 4603, 4627, 15008, 4629, 15092, 50708, 4610, 4611, 4612, 
                                       4613, 4614, 4617, 4618, 4620, 4624, 44065, 4601, 4606, 4612) 
                  THEN COMP_BASE_VALUE + COALESCE(tax.IGST, 0) 
                  ELSE 0 
              END AS Payable_To_RE,
              'One Time' AS One_Time_Third_Party,
              CASE 
                WHEN c.charge_code IN (4605, 4617, 4667, 4644, 4625, 4611, 4601, 15092, 4611, 4644, 15005, 
                                       4625, 4667) 
                  THEN COMP_BASE_VALUE + COALESCE(tax.IGST, 0) 
                  ELSE 0 
              END AS Payable_To_Third_Party
       FROM efl_neo_cas_lms.Loan_Application A
       JOIN efl_neo_cas_lms.SUB_LOAN B ON A.Id = B.APPLICATION_FK
       JOIN efl_neo_cas_lms.Application_Charges C ON C.Sub_loan_fk = B.id
       LEFT JOIN (
         SELECT TAX_STRUCTURE_DETAIL, SUM(TAX_BREAK_UP_AMOUNT) AS IGST
         FROM efl_neo_cas_lms.CHARGE_TAX_STRUCTURE
         GROUP BY TAX_STRUCTURE_DETAIL
       ) tax ON C.CURRENT_TAX_DETAIL = tax.TAX_STRUCTURE_DETAIL
       WHERE is_parent_sub_loan = 1
         AND C.COMP_BASE_VALUE > 0
         AND A.APPLICATION_NUMBER = '${applicationNumber}'`,
      [],  // Optional: Bind parameters if needed
      { outFormat: oracledb.OBJECT }
    );
    
    const result = {repyamentDetails:_REPAYMENTSCHEDULERESULT.rows, applicantBase: _MAINQUERYRESULT.rows, feesDetails: _FEESRESULT.rows}

      
      console.log(result);
      res.status(200).send({message:'Successfully connected to Oracle Database', data:result})
    } catch (err) {
      console.error('Error connecting to Oracle Database', err);
      res.status(500).send(err)
  
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error('Error closing the connection', err);
          res.status(500).send(err)
  
        }
      }
    }
  }

  getCurrency = (amount) =>{
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,  // You can specify the number of decimal places here
    }).format(amount);
    return formattedAmount
  }

  const toSmallRoman = (num) => {
    const romanMap = [
      'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
      'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'
    ];
    return romanMap[num] || ''; // Handle numbers beyond the array length
  };

  exports.generateKFSPdf = async(req,res) => {
    const pdf = require('html-pdf');
    const templateValues = template[req.params.language];
    const applicationNo = req.params.APPLICATION_NUMBER.trim();
      let KFS_RESULT = '';
      
      KFS_RESULT = await getKFSApplicantQuery(applicationNo);
      if(KFS_RESULT.isSuccess){
        applicant = KFS_RESULT.result.applicant[0]
        repaymentDetails = KFS_RESULT.result.repaymentDetails
        charge = KFS_RESULT.result.charges

        const charges = charge.map((rowdata,index) => {
          // Create the row structure
          return `
            <tr>
            <td >${toSmallRoman(index)}</td>
            <td colspan="3">${rowdata.CHARGE_NAME ? rowdata.CHARGE_NAME : ""}</td>
            <td class="text-right" style="width:12%" valign="top">${rowdata.ONE_TIME_RE ? rowdata.ONE_TIME_RE : ""}</td>
            <td  class="text-right" style="width:12%" valign="top">${(rowdata.PAYABLE_TO_RE &&  rowdata.PAYABLE_TO_RE != 0) ? getCurrency(rowdata.PAYABLE_TO_RE) : "-"}</td>
            <td  class="text-right" style="width:12%" valign="top">${rowdata.ONE_TIME_THIRD_PARTY ? rowdata.ONE_TIME_THIRD_PARTY : ""}</td>
            <td class="text-right" style="width:26%" valign="top" colspan="3">${(rowdata.PAYABLE_TO_THIRD_PARTY  &&  rowdata.PAYABLE_TO_THIRD_PARTY != 0) ? getCurrency(rowdata.PAYABLE_TO_THIRD_PARTY) : "-"}</td>
        </tr>
          `;
        }).join("");

        const repaymentHeader = `
        <table style="border-collapse: collapse;font-size:23px;border: 1px solid black; width: 100%;page-break-after: always;">
          <tr>
          <td style="width:16%;text-align:center">${templateValues[80]}</td>
          <td style="width:21%;text-align:center;padding-left:15px;padding-right:15px">${templateValues[81]}</td>
          <td style="width:21%;text-align:center">${templateValues[82]}</td>
          <td style="width:21%;text-align:center">${templateValues[83]}</td>
          <td style="width:21%;text-align:center">${templateValues[84]}</td>
          </tr>`
        
      
      // const rows = repaymentDetails.slice(0, 32).map((rowData,index) => {
          // Create the row structure
          let records = []
          let loops = Math.floor(repaymentDetails.length / 32)
          if(repaymentDetails.length % 32){
            loops++
          }
          for(let i = 0; i < loops; i++) {
            
            records.push(repaymentHeader)
            for(let j=1; j <= 32; j++){
             if(repaymentDetails[(i*32) + j -1]?.INSTALLMENT_NUMBER){
              let row = `<tr>
                            <td style="width:16%;text-align:right">${repaymentDetails[(i*32) + j -1]?.INSTALLMENT_NUMBER}</td>
                            <td style="width:21%;text-align:right;padding-left:15px;padding-right:15px">${getCurrency(repaymentDetails[(i*32) + j -1]?.OPENINGBALANCE)}</td>
                            <td style="width:21%;text-align:right">${getCurrency(repaymentDetails[(i*32) + j -1]?.PRINCIPALAMOUNT)}</td>
                            <td style="width:21%;text-align:right">${getCurrency(repaymentDetails[(i*32) + j -1]?.INTERESTAMOUNT)}</td>
                            <td style="width:21%;text-align:right">${getCurrency(repaymentDetails[(i*32) + j -1]?.INSTALMENT)}</td>
                        </tr>`
              records.push(row)
             }
            }
            records.push('</table>')
          }  

      const htmlContent = `
  <html>
    <head>
      <title>Sample PDF</title>
    </head>
    <body>
      <style>
       tr {
      page-break-inside: avoid; /* Avoid breaking inside a row */
    }
       tr.break-page {
      page-break-before: always; /* Start a new page before this row */
    }
table {
        border-collapse: collapse;
        width: 100%;
    }
    th, td {
        border: 1px solid black;
        padding: 5px; /* Optional, to improve readability */
    }
    p {
        margin-top: 0px;
        margin-bottom: 0px;
    }
    .text-right{
        text-align: right;
    }  
        </style>
      <h1 style="text-align: center;font-size:25px">${templateValues[0]}</h1>
      <h1 style="text-align: center;font-size:25px">${templateValues[1]}</h1>
      <table style="border-collapse: collapse;font-size:20px;border: 1px solid black; width: 100%;page-break-after: always;page-break-inside: avoid;">
        <tr>
            <td style="width:10%;font-weight:600">1</td>
            <td colspan="2" style="font-weight:600">${templateValues[2]}</td>
            <td colspan="3">${applicant.APPLICATION_NUMBER ? applicant.APPLICATION_NUMBER : ""}</td>
            <td colspan="2" style="font-weight:600">${templateValues[3]}</td>
            <td colspan="2">${applicant.TYPE_OF_LOAN ? applicant.TYPE_OF_LOAN : ""}</td>
        </tr>
        <tr>
            <td style="font-weight:600">2</td>
            <td colspan="5" style="font-weight:600">${templateValues[4]}</td>
            <td colspan="4" class="text-right"> ${applicant.SANCTION_AMOUNT ? getCurrency(applicant.SANCTION_AMOUNT) : ""}</td>
        </tr>
        <tr>
            <td style="font-weight:600">3</td>
            <td colspan="5">
            <p style="font-weight:600">${templateValues[5]}</p>
            <p>${templateValues[6]}</p>
            <p>${templateValues[7]}
             ${templateValues[8]}</p>
            </td>
            <td colspan="4"></td>
        </tr>
        <tr>
            <td style="font-weight:600">4</td>
            <td colspan="5" style="font-weight:600">${templateValues[9]})</td>
            <td colspan="4" class="text-right">${applicant.TENURE ? applicant.TENURE : 0} ${templateValues[85]}</td>
        </tr>
        <tr>
            <td style="font-weight:600">5</td>
            <td colspan="9" style="font-weight:600">${templateValues[10]}</td>
        </tr>
        <tr>
            <td style="width:26%" valign="top" colspan="2">${templateValues[11]}</td>
            <td style="width:17%" valign="top" colspan="2">${templateValues[12]}</td>
            <td style="width:17%" valign="top" colspan="2">${templateValues[13]}</td>
            <td style="width:40%;color:red" colspan="4" valign="top">${templateValues[14]}n</td>
        </tr>
        <tr>
            <td colspan="2" >${applicant.INSTALLMENT_TYPE ? applicant.INSTALLMENT_TYPE : ""}</td>
            <td colspan="2" class="text-right">${applicant.NUMBER_OF_EPIS ? applicant.NUMBER_OF_EPIS : ""}</td>
            <td colspan="2" class="text-right">${applicant.EPI ? getCurrency(applicant.EPI) : ""}</td>
            <td colspan="4"></td>
        </tr>
         <tr>
            <td style="font-weight:600">6</td>
            <td colspan="5" style="font-weight:600">${templateValues[15]}</td>
            <td colspan="4" class="text-right">${applicant.RATE ? applicant.RATE + "% | " + applicant.RATE_TYPE : ""}</td>
        </tr>
         <tr>
            <td style="font-weight:600">7</td>
            <td colspan="9" style="font-weight:600">${templateValues[16]}</td>
        </tr>
         <tr>
            <td  style="width:13%" valign="top">${templateValues[17]}</td>
            <td style="width:13%" valign="top">${templateValues[18]}</td>
            <td style="width:13%" valign="top" colspan="2">${templateValues[19]}</td>
            <td style="width:13%" valign="top">${templateValues[20]} </br> ${templateValues[21]}</td>
            <td style="color:red;width:22%" valign="top" colspan="2" >${templateValues[22]}</td>
            <td style="width:26%" valign="top" colspan="3">${templateValues[23]} <br> ${templateValues[24]}</td>
        </tr>
        <tr>
            <td colspan="5"></td>
            <td>${templateValues[25]}</td>
            <td>${templateValues[26]}</td>
            <td >${templateValues[27]}</td>
            <td colspan="2">${templateValues[28]}</td>
        </tr>
        <tr>
            <td class="text-right" style="width:13%">${templateValues[86]}</td>
            <td class="text-right" style="width:13%">${templateValues[86]}</td>
            <td class="text-right" style="width:13%" colspan="2">${templateValues[86]}</td>
            <td class="text-right" style="width:13%">${templateValues[86]}</td>
            <td class="text-right" style="width:11%">${templateValues[86]}</td>
            <td class="text-right" style="width:11%">${templateValues[86]}</td>
            <td class="text-right" style="width:8%">${templateValues[86]}</td>
            <td class="text-right" style="width:16%" colspan="2">${templateValues[86]}</td>
        </tr>
        <tr>
            <td style="font-weight:600">8</td>
            <td colspan="9" style="font-weight:600">${templateValues[29]}</td>
        </tr>
        <tr>
            <td colspan="4"></td>
            <td style="width:24%" colspan="2">${templateValues[30]}</td>
            <td style="width:38%" colspan="4">${templateValues[31]}</td>
        </tr>
        <tr>
            <td colspan="4"></td>
            <td style="width:12%" valign="top">${templateValues[32]}</td>
            <td  style="width:12%" valign="top">${templateValues[33]}</td>
            <td  style="width:12%" valign="top">${templateValues[34]}</td>
            <td style="width:26%" valign="top" colspan="3">${templateValues[35]}</td>
        </tr>
        ${charges}
        <tr>
            <td style="font-weight:600">9</td>
            <td colspan="4" style="color:red">${templateValues[36]}</td>
            <td ></td>
            <td ></td>
            <td colspan="3"></td>
        </tr>
        <tr>
        <td style="font-weight:600">10</td>
        <td colspan="9" style="color:red">${templateValues[37]}</td>
        </tr>
        <tr>
            <td>(i)</td>
            <td colspan="5"  valign="top">${templateValues[38]}</td>
            <td colspan="4">${applicant.PENAL_CHARGES ? applicant.PENAL_CHARGES : ""}</td>
        </tr>
        <tr>
            <td>(ii)</td>
            <td colspan="5" valign="top">${templateValues[39]}</td>
            <td colspan="4">${applicant.OTHER_PENAL_CHARGES ? applicant.OTHER_PENAL_CHARGES : ""}</td>
        </tr>
        <tr>
            <td>(iii)</td>
            <td colspan="5" valign="top">${templateValues[40]}</td>
            <td colspan="4">${applicant.FORECLOSURE_CHARGES ? applicant.FORECLOSURE_CHARGES : ""}</td>
        </tr>
        <tr>
            <td>(iv)</td>
            <td colspan="5" valign="top">${templateValues[41]}</td>
            <td colspan="4">${applicant.CHARGES_FOR_SWITCHING_OF_LOANS ? applicant.CHARGES_FOR_SWITCHING_OF_LOANS : ""}</td>
        </tr>
        <tr style="page-break-after: always;">
            <td>(v)</td>
            <td colspan="5" valign="top">${templateValues[42]}</td>
            <td colspan="4">${applicant.BANK_CHARGES ? applicant.BANK_CHARGES : ""}</td>
        </tr>
      </table>

      <h1 style="text-align: center;font-size:30px;margin-top:100px;margin-bottom:50px">${templateValues[43]}</h1>

      <table style="border-collapse: collapse;font-size:23px;border: 1px solid black; width: 100%;page-break-after: always;">
        <tr style="height: 50px;">
          <td style="width:10%">1</td>
          <td style="width:56.66%" colspan="5">${templateValues[44]}</td>
          <td style="width:33.33%" colspan="3"></td>
        </tr>
        <tr style="height: 50px;">
          <td>2</td>
          <td colspan="5">${templateValues[45]}</td>
          <td colspan="3"></td>
        </tr>
        <tr style="height: 50px;">
          <td>3</td>
          <td colspan="5">${templateValues[46]}</td>
          <td colspan="3"></td>
        </tr>
        <tr style="height: 50px;">
          <td>4</td>
          <td colspan="5">${templateValues[47]}</td>
          <td colspan="3" class="text-right">${templateValues[48]}</td>
        </tr>
        <tr style="height: 50px;">
        <td>5</td>
        <td colspan="8">${templateValues[49]}</td>
        </tr>
        <tr style="height: 50px;">
        <td style="width:33.33%" valign="top" colspan="3">${templateValues[50]}</td>
        <td style="width:33.33%" valign="top" colspan="3">${templateValues[51]}</td>
        <td style="width:33.33%" valign="top" colspan="3">${templateValues[52]}</td>
        </tr>
        <tr style="height: 50px;">
        <td style="width:33.33%" valign="top" class="text-right" colspan="3">${templateValues[86]}</td>
        <td style="width:33.33%" valign="top" class="text-right" colspan="3">${templateValues[86]}</td>
        <td style="width:33.33%" valign="top" class="text-right" colspan="3">${templateValues[86]}</td>
        </tr>
        <tr style="height: 50px;">
        <td>6</td>
        <td colspan="8">${templateValues[53]}</td>
        </tr>
        <tr style="height: 50px;">
          <td colspan="6" style="padding-left:70px">${templateValues[54]}</td>
          <td colspan="3" class="text-right">${templateValues[55]}</td>
        </tr>
        <tr style="height: 50px">
          <td colspan="6" style="padding-left:70px">${templateValues[56]}</td>
          <td colspan="3" class="text-right"></td>
        </tr>
      </table>  


      <h1 style="text-align: center;font-size:30px;margin-top:50px;margin-bottom:50px">${templateValues[57]}</h1>

      <table style="border-collapse: collapse;font-size:23px;border: 1px solid black; width: 100%;page-break-after: always;">
      <tr>
        <td style="width:10%;text-align:center;font-weight:600">${templateValues[58]}</td>
        <td style="width:65%;text-align:center;font-weight:600">${templateValues[59]}</td>
        <td style="width:25%;text-align:center;font-weight:600">${templateValues[60]}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">1</td>
        <td style="width:65%">${templateValues[61]}</td>
        <td style="width:25%" class="text-right">${applicant.SANCTION_AMOUNT ? getCurrency(applicant.SANCTION_AMOUNT) : ""}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">2</td>
        <td style="width:65%">${templateValues[62]}</td>
        <td style="width:25%" class="text-right">${applicant.TENURE ? applicant.TENURE : ""} ${templateValues[85]}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">a)</td>
        <td style="width:65%">${templateValues[63]}</td>
        <td style="width:25%" class="text-right"></td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">b)</td>
        <td style="width:65%">${templateValues[64]}<br>${templateValues[65]}</td>
        <td style="width:25%" class="text-right">${applicant.LOAN_TERMS ? applicant.LOAN_TERMS : ""} <br>
        ${applicant.EPI ? getCurrency(applicant.EPI) : ""} <br>
        ${applicant.NUMBER_OF_EPIS ? applicant.NUMBER_OF_EPIS : ""}
        </td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">c)</td>
        <td style="width:65%;color:red;">${templateValues[66]}</td>
        <td style="width:25%" class="text-right">${templateValues[86]}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">d)</td>
        <td style="width:65%;color:red;">${templateValues[67]}</td>
        <td style="width:25%" class="text-right"></td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">3</td>
        <td style="width:65%">${templateValues[68]}</td>
        <td style="width:25%" class="text-right">${applicant.RATE_TYPE ? applicant.RATE_TYPE : ""}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">4</td>
        <td style="width:65%">${templateValues[69]}</td>
        <td style="width:25%" class="text-right">${applicant.RATE ? applicant.RATE : ""}%</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">5</td>
        <td style="width:65%">${templateValues[70]}</td>
        <td style="width:25%" class="text-right">${applicant.TOTALINTERESTAMOUNT ? getCurrency(applicant.TOTALINTERESTAMOUNT) : ""}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">6</td>
        <td style="width:65%">${templateValues[71]}</td>
        <td style="width:25%" class="text-right">${applicant.FEES ? getCurrency(applicant.FEES) : ""}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">A</td>
        <td style="width:65%">${templateValues[72]}</td>
        <td style="width:25%" class="text-right">${applicant.PAYABLE_TO_RE ? getCurrency(applicant.PAYABLE_TO_RE) : ""}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">B</td>
        <td style="width:65%">${templateValues[73]}</td>
        <td style="width:25%" class="text-right">${applicant.PAYABLE_TO_THIRD_PARTY ? getCurrency(applicant.PAYABLE_TO_THIRD_PARTY) : ""}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">7</td>
        <td style="width:65%">${templateValues[74]}</td>
        <td style="width:25%" class="text-right">${applicant.NET_DISBURSED_AMT ? getCurrency(applicant.NET_DISBURSED_AMT) : ""}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">8</td>
        <td style="width:65%">${templateValues[75]}</td>
        <td style="width:25%" class="text-right">${applicant.TOTAL_AMT_PAID_BY_BORROWER ? getCurrency(applicant.TOTAL_AMT_PAID_BY_BORROWER) : ""}</td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">9</td>
        <td style="width:65%">${templateValues[76]}</td>
        <td style="width:25%" class="text-right"></td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">10</td>
        <td style="width:65%">${templateValues[77]}</td>
        <td style="width:25%" class="text-right"></td>
      </tr>
      <tr>
        <td style="width:10%;text-align:center;">11</td>
        <td style="width:65%">${templateValues[78]}</td>
        <td style="width:25%" class="text-right">${applicant.FIRST_INSTALLMENT_DATE ? applicant.FIRST_INSTALLMENT_DATE : ""}</td>
      </tr>
      <table/>  
      
      <h1 style="text-align: center;font-size:30px;margin-top:50px;margin-bottom:50px">${templateValues[79]}</h1>

      ${records.join("")}

    </body>
      </html>`;

      const options = {
    format: 'A4',
    orientation: 'portrait', // 'landscape' for landscape orientation
    border: {
      top: '0mm',
      right: '15mm',
      bottom: '10mm',
      left: '15mm'
    },
    header: {
      height: '15mm',
      contents: {
        // Function for dynamic content on different pages
        first: '<div style="text-align: right; font-size: 30px; font-weight: bold;">Annex A</div>',  // For the first page
        2: '<div style="text-align: right; font-size: 100px; font-weight: bold;"></div>',    // For the second page
        3: '<div style="text-align: right; font-size: 30px; font-weight: bold;">Annex B</div>',    // For the second page
        4: '<div style="text-align: right; font-size: 30px; font-weight: bold;">Annex c</div>',    // For the second page
      
      }
    }
      };

      // Generate the PDF and save it as 'output.pdf'
      pdf.create(htmlContent,options).toFile(path.join("D:\\KFS APP\\efl_kfs_node\\assets", "SamplePDFDocument.pdf"), (err, result) => {
  if (err) return console.log(err);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${applicationNo}_KFS.pdf"`);
  res.sendFile(result.filename, (err) => {
    if (err) {
      res.status(500).send('Error sending file');
    }
  });
      });
    }else{
        res.status(KFS_RESULT.statusCode).send(KFS_RESULT);
    }
}

