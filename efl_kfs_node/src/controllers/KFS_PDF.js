const db = require("../models");
const axios = require('axios');
const fs = require("fs");
const path = require("path");
const oracledb = require('oracledb');
const {template,contingentCharges,languages} = require('../../template')
const sql = require('mssql');
const puppeteer = require('puppeteer');
const DownloadKFSDetails = db.DownloadKFSDetails;
const AWS = require('aws-sdk');

//s3 config
AWS.config.update({
  region: process.env.AWS_REGION, // e.g., 'us-east-1'
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});

//S3 upload function

const uploadPDF = async(filePath) => {
  let s3 = new AWS.S3();
  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);
  
  const params = {
    Bucket: process.env.BUCKET_NAME, 
    Key: fileName,
    Body: fileContent,
    ContentType: 'application/pdf'
  };
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
        if (err) {
            return reject(`Error uploading file: ${err}`);
        }
        console.log(`File uploaded successfully. ${data.Location}`);
        resolve(data.Location); // Resolve with the URL
    });
  });


}




//Apr sp function
const getApr = async(APR_Parameters,Structuredinst) => {

  Structuredinst = Structuredinst.join("")
  let aprConnection = await sql.connect(db.dbPoolConfig);
  const request = new sql.Request();

APR_Parameters1 = APR_Parameters[0][0]
APR_Parameters2 = APR_Parameters[1][0]


let deductions = ((APR_Parameters1.FINANCE_AMOUNT ? APR_Parameters1.FINANCE_AMOUNT : 0) 
- ((APR_Parameters1.FINANCE_AMOUNT ? APR_Parameters1.FINANCE_AMOUNT : 0) 
- ((APR_Parameters1.CASH_COLLATERAL_UPFRONT ? APR_Parameters1.CASH_COLLATERAL_UPFRONT : 0) 
+ (APR_Parameters1.SUBVENTION ? parseInt(APR_Parameters1.SUBVENTION.toFixed(2)) : 0) 
+ (APR_Parameters2.PAYABLE_TO_RE ? APR_Parameters2.PAYABLE_TO_RE : 0) 
+ (APR_Parameters2.PAYABLE_TO_THIRD_PARTY ? APR_Parameters2.PAYABLE_TO_THIRD_PARTY : 0))))

// console.log(APR_Parameters1.FINANCE_AMOUNT,"APR_Parameters1.FINANCE_AMOUNT");
// console.log(APR_Parameters1.TENURE,"APR_Parameters1.TENURE");
// console.log( APR_Parameters1.CASHCOLINST," APR_Parameters1.CASHCOLINST");
// console.log(deductions,"deductions");
// console.log(Structuredinst,"Structuredinst");

  try{
  request.input('LoanAmount', sql.INT, 15065810); 
  request.input('NoofInst', sql.INT, 30);
  request.input('CashColInst', sql.INT, 0);
  request.input('EMItype', sql.NVarChar(50), 'S');
  // request.input('Structuredinst', sql.NVarChar(500), Structuredinst);
  request.input('Structuredinst', sql.NVarChar(500), '1,8,573169$9,12,1326460$13,29,573169$30,30,573148$31,31,-3013162');
  request.input('Deduction', sql.INT, 142400);
  request.input('LastDeduct', sql.INT, 0);
  const data = await request.execute('Usp_Schedule_Generation_IRR');
    console.log(data.recordset);
  return data.recordset[0] ? (data.recordset[0].IRR * 100).toFixed(2) : 0
  }catch(e){
    console.log(e);
    
    return null;
  }finally{
    if(aprConnection){
      aprConnection.close();
    }
  }
}

// const config = {  //config to connect DASHBOARD database
//       server:"192.168.1.53",
//       user: 'SSIS_USER',
//       password: "Efl!2023@",
//       database: "EDW",
//       options: {
//         trustServerCertificate: true // Change this according to your server configuration
//       }
//     };

//oracle connection finnone uat
const oracleConnection = async(applicationNo) => {
    let connection;
    let  applicationNumber = applicationNo;
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
    if(_MAINQUERYRESULT.rows[0]){
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
    
        // const result = {repyamentDetails:_REPAYMENTSCHEDULERESULT.rows, applicantBase: _MAINQUERYRESULT.rows, feesDetails: _FEESRESULT.rows}
        const KFSResult = {
        applicant: _MAINQUERYRESULT.rows,
        repaymentDetails: _REPAYMENTSCHEDULERESULT.rows,
        charges:  _FEESRESULT.rows
        }
   
        return result = {
        isSuccess: true,
        message: 'Successfully connected to Oracle Database',
        statusCode: 200,
        result: KFSResult
        }
        }else{
        return result = {
        isSuccess: false,
        message: 'This Applicant is not found',
        statusCode: 400
    }
        }
     
    } catch (err) {
        return result = {
            isSuccess: false,
            message: error,
            statusCode: 500,
            result: error
        }
  
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error('Error closing the connection', err);
        //   res.status(500).send(err)
  
        }
      }
    }
  }


  //currency format
  getCurrency = (amount) =>{
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,  // You can specify the number of decimal places here
    }).format(amount);
    return formattedAmount.replace('₹', '₹ ');
  }

  const toSmallRoman = (num) => {
    
    const romanMap = [
      '0','i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
      'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'
    ];
    return romanMap[num] || ''; // Handle numbers beyond the array length
  };


  //get applicant details from 192.168.1.53 using query
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
        .query(`SELECT * FROM OPENQUERY([efldb01_fqdn_ssl],'select application_number from efl_neo_cas_lms.loan_application WHERE application_number = "APPL00144543"')`);
        // .input('applicationNo', sql.VarChar, applicationNo) // Define the input parameter
        
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
  
  //get applicant details from 192.168.1.53 using stored Procedure
  const getKFSApplicantSP = async (appNo) => {
    const applicationNo = appNo;
    
    let result = {};
    
    let connection;
    try {
     
      connection = await sql.connect(db.dbPoolConfig);
      
      const applicantBase = new sql.Request();

//       const applicantQuery = `SELECT *
// FROM OPENQUERY([efldb01_fqdn_ssl], '
// SELECT DISTINCT
//     a.APPLICATION_NUMBER,
//      case when SCHEME_NAME in (''AFL Balance Transfer'',''AFL Term Loan'',''AFL Purchase'',
// ''AFL Top Up'',''MSBL Term Loan'',''SBL Balance Transfer'',
// ''SBL Term Loan'',''MSBL Topup'',
// ''SBL Topup'',''MSBL Balance Transfer'') then ''Property  Loan''
// when SCHEME_NAME =''EEL_Solar'' then ''Solar  Loan''
// when SCHEME_NAME =''Pragati'' then ''Business Loan''
// when SCHEME_NAME =''EEL_UNSEC'' then ''Unsecured Business Loan''
// when scheme_code in (''SBFBLTP1'',''BLCEFSEC'',''SBFBLSEC'',''BLREFSEC'',''BLEEFSEC'',''BLCFSEC'')
// then ''Business Loan''
// when scheme_code in (''ECLGSEEF'',''ECLGSREF'',''ECLGSCEF'',''ECLGSSBF'',''ECLGSRE'')
// then ''ECLGS Loan''
// when scheme_code in (''CORPPRO1'',''CORPLAP1'',''SBFPLBT1'',''SBFBLLP1'')
// then ''Loan against Property''
// when scheme_code in  (''SBFBLMA1'',''SBFBL'',''Core_SBF'',''CORPBLM1'',''CORPOML1'',''CORPREF1'',''CEFLEASE'',''EEFMLLS1'',''EEFMLSI1'',
// ''EEFMLRN1'',''EEFMLHP1'',''EEFBLEC1'',''EEFMLTL1'',''EEFBLSB1'',''EEFBLTP1'',''EEFBLES1'',''EEFBLBT1'',''CEFBLBT1'',''CEFBLSB1'',''CEFBLTP1'',
// ''CEFMLHP1'',''CEFBLEC1'',''CEFBLES1'',''CEFMLLS1'',''CEFMLRN1'',''CEFMLSI1'',''CEFMLTL1'',''SMFSEC'',''SMFSECL'')
// then ''Machine Purchase Loan''
// when scheme_code in (''SLAPNEW1'',''SLAPEXI1'') then ''Property Purchase Loan''
// when scheme_code in (''REFRTSP1'',''REFRTSS1'',''REFRTSR1'',''COERELAP'',''CoreREFL'',''Coreref'',''REFMLTL1'',''R_Solar'',''REFRETP2'',
// ''REFRETR2'',''REFRETP1'',''RSolar'',''REFRETR1'',''Solar1'')
// then ''Solar Purchase Loan''
// when scheme_code in (''TRADETL1'',''TRADEDL1'') then ''Trade Finance''
// when scheme_code in (''EEFBLUB1'',''CEFBLUB1'',''REFUNSEC'',''CEFUNSEC'',''EEFUNSEC'',''SBFBLUnS'')
// then ''Unsecured Business Loan''
// when scheme_code in (''SBFBLUB1'',''SBFBLUB2'',''SBFWCDL1'',''SBFWCTL1'',''SBFBDSI1'',''SBFBDHU1'',''CORPUBL1'',''WCDLUBL'',
// ''WCTC'',''WCTLBL'',''WCDLBL'') then ''Working capital Loan''
// else
//   ( SELECT    Name AS Name   FROM efl_neo_cas_lms.Generic_Parameter WHERE    Id = A.Loan_Application_Type
//   ) end as  TYPE_OF_LOAN ,
//     rs.SAMOUNT_BASEVALUE AS FINANCE_AMOUNT,
//     sl.SANCTIONED_TENURE AS Tenure,
//     (SELECT Name
//      FROM efl_neo_cas_lms.Generic_Parameter
//      WHERE Id = RS.REPAY_PAYMENT_FREQUENCY
//     ) AS loan_terms,
//     TO_CHAR(rs.FIRST_INSTALLMENT_DATE, ''DD-MON-YYYY'') AS FIRST_INSTALLMENT_DATE,
//     rs.rate,
//     (SELECT Name
//      FROM EFL_NEO_CAS_LMS.generic_parameter
//      WHERE dtype = ''RepayPolicyRateType''
//      AND code = TO_CHAR(rs.RATE_TYPE)
//     ) AS Rate_Type,
//     SL.Samount_Basevalue AS SANCTION_AMOUNT,
//     rs1.TotalInterestAmount,
//     SL.Samount_Basevalue + rs1.TotalInterestAmount AS TOTAL_AMT_PAID_BY_BORROWER,
//     (SELECT Name
//      FROM efl_neo_cas_lms.Generic_Parameter
//      WHERE Id = Ld.Loan_Disbursal_Status
//     ) AS Loan_Disbursal_Status,
//     case  when upper(product_code) like ''%EEF%'' then ''EEF''
//       when upper(product_code) like ''%CEF%'' then ''CEF''
//       when upper(product_code) like ''%SBF%'' then ''SBF''
//       when upper(product_code) like ''%SMF%'' then ''SMF''
//       when upper(product_code) like ''%EEL%'' then ''EEL''
//       when upper(product_code) like ''%TW%'' then ''TW''
//       when upper(product_code) like ''%REF%'' then ''REF''
//       when upper(product_code) like ''%CORTRAD1%'' then ''TRADE FINANCE''
//       when upper(product_code) like ''%COR%'' then ''CORPORATE FINANCE''
//       when upper(product_code) like ''%EMPU1%'' then ''EMPLOYEE''
//       when upper(product_code) like ''%FIG%'' then ''FIG''
//       when upper(product_code) like ''%JUMBOBT1%'' then ''EEL''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%EEF%'' then ''EEF''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%CEF%'' then ''CEF''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%REF%'' then ''REF''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%EEL%'' then ''EEL''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%SBF%'' then ''SBF''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%BL_CF_SEC%'' then ''CEF''
//       when upper(product_code) in (''BLSEC'')           and upper(scheme_code) like ''BL_EMP_SEC'' then ''EMPLOYEE''
//    else ''NA'' end as Vertical,rs.MORATORIUM_IN_MONTH
// FROM efl_neo_cas_lms.LOAN_APPLICATION A
// LEFT JOIN efl_neo_cas_lms.SUB_LOAN SL ON a.id = sl.application_fk
// LEFT JOIN efl_neo_cas_lms.PARTY P ON A.ID = P.LOAN_APPLICATION_FK
// LEFT JOIN efl_neo_cas_lms.CUSTOMER C ON C.ID = P.CUSTOMER
// LEFT JOIN efl_neo_cas_lms.Loan_Disbursal Ld ON Sl.Id = Ld.Subloan_Id
// LEFT JOIN EFL_NEO_CAS_LMS.repayment_schedule rs ON sl.repayment_schedule = rs.id
// LEFT JOIN efl_neo_cas_lms.loan_product p ON p.Id = Sl.Product
// LEFT JOIN efl_neo_cas_lms.Loan_Scheme ls ON ls.Id = Sl.Scheme
// LEFT JOIN (
//    SELECT application_number,
// sum("interestAmount") as TotalInterestAmount
//   FROM EFL_NEO_CAS_LMS.loan_Application A
// LEFT JOIN
// (
//     select application_fk,repayment_schedule from
//     (
//     select application_fk,repayment_schedule
//         ,row_number()over(partition by application_fk order by repayment_schedule desc)rnk
//     from EFL_NEO_CAS_LMS.SUB_LOAN where IS_PARENT_SUB_LOAN=1 
//     )a
//     where rnk=1
// )SL ON a.id = sl.application_fk
// LEFT OUTER JOIN EFL_NEO_CAS_LMS.repayment_schedule rs ON sl.repayment_schedule = rs.id
// ,jSON_TABLE(coalesce(CONSOLIDATED_RESPONSE,NATIVE_RESPONSE), ''$.coreRepaymentScheduleDetailDTOList[*]''
//     COLUMNS(
//     "interestAmount" PATH ''$.interestAmount''
//     )) "J"
//     group by application_number  
// ) rs1 ON a.application_number = rs1.application_number
 
// WHERE p.party_role = 0
// AND IS_PARENT_SUB_LOAN = 1
// AND a.APPLICATION_NUMBER = ''${applicationNo}''
// ')
// `
//       const applicantQuery = `SELECT *
// FROM OPENQUERY([efldb01_fqdn_ssl], '
// SELECT DISTINCT
//     a.APPLICATION_NUMBER,
//      case when SCHEME_NAME in (''AFL Balance Transfer'',''AFL Term Loan'',''AFL Purchase'',
// ''AFL Top Up'',''MSBL Term Loan'',''SBL Balance Transfer'',
// ''SBL Term Loan'',''MSBL Topup'',
// ''SBL Topup'',''MSBL Balance Transfer'') then ''Property  Loan''
// when SCHEME_NAME =''EEL_Solar'' then ''Solar  Loan''
// when SCHEME_NAME =''Pragati'' then ''Business Loan''
// when SCHEME_NAME =''EEL_UNSEC'' then ''Unsecured Business Loan''
// when scheme_code in (''SBFBLTP1'',''BLCEFSEC'',''SBFBLSEC'',''BLREFSEC'',''BLEEFSEC'',''BLCFSEC'')
// then ''Business Loan''
// when scheme_code in (''ECLGSEEF'',''ECLGSREF'',''ECLGSCEF'',''ECLGSSBF'',''ECLGSRE'')
// then ''ECLGS Loan''
// when scheme_code in (''CORPPRO1'',''CORPLAP1'',''SBFPLBT1'',''SBFBLLP1'')
// then ''Loan against Property''
// when scheme_code in  (''SBFBLMA1'',''SBFBL'',''Core_SBF'',''CORPBLM1'',''CORPOML1'',''CORPREF1'',''CEFLEASE'',''EEFMLLS1'',''EEFMLSI1'',
// ''EEFMLRN1'',''EEFMLHP1'',''EEFBLEC1'',''EEFMLTL1'',''EEFBLSB1'',''EEFBLTP1'',''EEFBLES1'',''EEFBLBT1'',''CEFBLBT1'',''CEFBLSB1'',''CEFBLTP1'',
// ''CEFMLHP1'',''CEFBLEC1'',''CEFBLES1'',''CEFMLLS1'',''CEFMLRN1'',''CEFMLSI1'',''CEFMLTL1'',''SMFSEC'',''SMFSECL'')
// then ''Machine Purchase Loan''
// when scheme_code in (''SLAPNEW1'',''SLAPEXI1'') then ''Property Purchase Loan''
// when scheme_code in (''REFRTSP1'',''REFRTSS1'',''REFRTSR1'',''COERELAP'',''CoreREFL'',''Coreref'',''REFMLTL1'',''R_Solar'',''REFRETP2'',
// ''REFRETR2'',''REFRETP1'',''RSolar'',''REFRETR1'',''Solar1'')
// then ''Solar Purchase Loan''
// when scheme_code in (''TRADETL1'',''TRADEDL1'') then ''Trade Finance''
// when scheme_code in (''EEFBLUB1'',''CEFBLUB1'',''REFUNSEC'',''CEFUNSEC'',''EEFUNSEC'',''SBFBLUnS'')
// then ''Unsecured Business Loan''
// when scheme_code in (''SBFBLUB1'',''SBFBLUB2'',''SBFWCDL1'',''SBFWCTL1'',''SBFBDSI1'',''SBFBDHU1'',''CORPUBL1'',''WCDLUBL'',
// ''WCTC'',''WCTLBL'',''WCDLBL'') then ''Working capital Loan''
// else
//   ( SELECT    Name AS Name   FROM efl_neo_cas_lms.Generic_Parameter WHERE    Id = A.Loan_Application_Type
//   ) end as  TYPE_OF_LOAN ,
//     rs.SAMOUNT_BASEVALUE AS FINANCE_AMOUNT,
//     sl.SANCTIONED_TENURE AS Tenure,
//     (SELECT Name
//      FROM efl_neo_cas_lms.Generic_Parameter
//      WHERE Id = RS.REPAY_PAYMENT_FREQUENCY
//     ) AS loan_terms,
//     TO_CHAR(rs.FIRST_INSTALLMENT_DATE, ''DD-MON-YYYY'') AS FIRST_INSTALLMENT_DATE,
//     CASE WHEN  upper(product_code) like ''%EEL%'' THEN rs.rate
// 	when upper(product_code) like ''%TW%'' THEN rs.rate
// 	ELSE RS.effective_interest_rate END AS rate,
//     (SELECT Name
//      FROM EFL_NEO_CAS_LMS.generic_parameter
//      WHERE dtype = ''RepayPolicyRateType''
//      AND code = TO_CHAR(rs.RATE_TYPE)
//     ) AS Rate_Type,
//     SL.Samount_Basevalue AS SANCTION_AMOUNT,
//     rs1.TotalInterestAmount,
//     SL.Samount_Basevalue + rs1.TotalInterestAmount AS TOTAL_AMT_PAID_BY_BORROWER,
//     (SELECT Name
//      FROM efl_neo_cas_lms.Generic_Parameter
//      WHERE Id = Ld.Loan_Disbursal_Status
//     ) AS Loan_Disbursal_Status,
//     case  when upper(product_code) like ''%EEF%'' then ''EEF''
//       when upper(product_code) like ''%CEF%'' then ''CEF''
//       when upper(product_code) like ''%SBF%'' then ''SBF''
//       when upper(product_code) like ''%SMF%'' then ''SMF''
//       when upper(product_code) like ''%EEL%'' then ''EEL''
//       when upper(product_code) like ''%TW%'' then ''TW''
//       when upper(product_code) like ''%REF%'' then ''REF''
//       when upper(product_code) like ''%CORTRAD1%'' then ''TRADE FINANCE''
//       when upper(product_code) like ''%COR%'' then ''CORPORATE FINANCE''
//       when upper(product_code) like ''%EMPU1%'' then ''EMPLOYEE''
//       when upper(product_code) like ''%FIG%'' then ''FIG''
//       when upper(product_code) like ''%JUMBOBT1%'' then ''EEL''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%EEF%'' then ''EEF''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%CEF%'' then ''CEF''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%REF%'' then ''REF''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%EEL%'' then ''EEL''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%SBF%'' then ''SBF''
//       when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%BL_CF_SEC%'' then ''CEF''
//       when upper(product_code) in (''BLSEC'')           and upper(scheme_code) like ''BL_EMP_SEC'' then ''EMPLOYEE''
//    else ''NA'' end as Vertical,rs.MORATORIUM_IN_MONTH
// FROM efl_neo_cas_lms.LOAN_APPLICATION A
// LEFT JOIN efl_neo_cas_lms.SUB_LOAN SL ON a.id = sl.application_fk
// LEFT JOIN efl_neo_cas_lms.PARTY P ON A.ID = P.LOAN_APPLICATION_FK
// LEFT JOIN efl_neo_cas_lms.CUSTOMER C ON C.ID = P.CUSTOMER
// LEFT JOIN efl_neo_cas_lms.Loan_Disbursal Ld ON Sl.Id = Ld.Subloan_Id
// LEFT JOIN EFL_NEO_CAS_LMS.repayment_schedule rs ON sl.repayment_schedule = rs.id
// LEFT JOIN efl_neo_cas_lms.loan_product p ON p.Id = Sl.Product
// LEFT JOIN efl_neo_cas_lms.Loan_Scheme ls ON ls.Id = Sl.Scheme
// LEFT JOIN (
//    SELECT application_number,
// sum("interestAmount") as TotalInterestAmount
//   FROM EFL_NEO_CAS_LMS.loan_Application A
// LEFT JOIN
// (
//     select application_fk,repayment_schedule from
//     (
//     select application_fk,repayment_schedule
//         ,row_number()over(partition by application_fk order by repayment_schedule desc)rnk
//     from EFL_NEO_CAS_LMS.SUB_LOAN where IS_PARENT_SUB_LOAN=1 
//     )a
//     where rnk=1
// )SL ON a.id = sl.application_fk
// LEFT OUTER JOIN EFL_NEO_CAS_LMS.repayment_schedule rs ON sl.repayment_schedule = rs.id
// ,jSON_TABLE(coalesce(CONSOLIDATED_RESPONSE,NATIVE_RESPONSE), ''$.coreRepaymentScheduleDetailDTOList[*]''
//     COLUMNS(
//     "interestAmount" PATH ''$.interestAmount''
//     )) "J"
//     group by application_number  
// ) rs1 ON a.application_number = rs1.application_number
 
// WHERE p.party_role = 0
// AND IS_PARENT_SUB_LOAN = 1
// AND a.APPLICATION_NUMBER = ''${applicationNo}''
// ')`
      const applicantQuery = `SELECT *
FROM OPENQUERY([efldb01_fqdn_ssl], '
SELECT DISTINCT
    a.APPLICATION_NUMBER,
     case when SCHEME_NAME in (''AFL Balance Transfer'',''AFL Term Loan'',''AFL Purchase'',
''AFL Top Up'',''MSBL Term Loan'',''SBL Balance Transfer'',
''SBL Term Loan'',''MSBL Topup'',
''SBL Topup'',''MSBL Balance Transfer'') then ''Property  Loan''
when SCHEME_NAME =''EEL_Solar'' then ''Solar  Loan''
when SCHEME_NAME =''Pragati'' then ''Business Loan''
when SCHEME_NAME =''EEL_UNSEC'' then ''Unsecured Business Loan''
when scheme_code in (''SBFBLTP1'',''BLCEFSEC'',''SBFBLSEC'',''BLREFSEC'',''BLEEFSEC'',''BLCFSEC'')
then ''Business Loan''
when scheme_code in (''ECLGSEEF'',''ECLGSREF'',''ECLGSCEF'',''ECLGSSBF'',''ECLGSRE'')
then ''ECLGS Loan''
when scheme_code in (''CORPPRO1'',''CORPLAP1'',''SBFPLBT1'',''SBFBLLP1'')
then ''Loan against Property''
when scheme_code in  (''SBFBLMA1'',''SBFBL'',''Core_SBF'',''CORPBLM1'',''CORPOML1'',''CORPREF1'',''CEFLEASE'',''EEFMLLS1'',''EEFMLSI1'',
''EEFMLRN1'',''EEFMLHP1'',''EEFBLEC1'',''EEFMLTL1'',''EEFBLSB1'',''EEFBLTP1'',''EEFBLES1'',''EEFBLBT1'',''CEFBLBT1'',''CEFBLSB1'',''CEFBLTP1'',
''CEFMLHP1'',''CEFBLEC1'',''CEFBLES1'',''CEFMLLS1'',''CEFMLRN1'',''CEFMLSI1'',''CEFMLTL1'',''SMFSEC'',''SMFSECL'')
then ''Machine Purchase Loan''
when scheme_code in (''SLAPNEW1'',''SLAPEXI1'') then ''Property Purchase Loan''
when scheme_code in (''REFRTSP1'',''REFRTSS1'',''REFRTSR1'',''COERELAP'',''CoreREFL'',''Coreref'',''REFMLTL1'',''R_Solar'',''REFRETP2'',
''REFRETR2'',''REFRETP1'',''RSolar'',''REFRETR1'',''Solar1'')
then ''Solar Purchase Loan''
when scheme_code in (''TRADETL1'',''TRADEDL1'') then ''Trade Finance''
when scheme_code in (''EEFBLUB1'',''CEFBLUB1'',''REFUNSEC'',''CEFUNSEC'',''EEFUNSEC'',''SBFBLUnS'')
then ''Unsecured Business Loan''
when scheme_code in (''SBFBLUB1'',''SBFBLUB2'',''SBFWCDL1'',''SBFWCTL1'',''SBFBDSI1'',''SBFBDHU1'',''CORPUBL1'',''WCDLUBL'',
''WCTC'',''WCTLBL'',''WCDLBL'') then ''Working capital Loan''
else
  ( SELECT    Name AS Name   FROM efl_neo_cas_lms.Generic_Parameter WHERE    Id = A.Loan_Application_Type
  ) end as  TYPE_OF_LOAN ,
    rs.SAMOUNT_BASEVALUE AS FINANCE_AMOUNT,
    sl.SANCTIONED_TENURE AS Tenure,
    (SELECT Name
     FROM efl_neo_cas_lms.Generic_Parameter
     WHERE Id = RS.REPAY_PAYMENT_FREQUENCY
    ) AS loan_terms,
    TO_CHAR(rs1.FIRST_INSTALLMENT_DATE, ''DD-MON-YYYY'') AS FIRST_INSTALLMENT_DATE,
    CASE WHEN  upper(product_code) like ''%EEL%'' THEN rs.rate
	when upper(product_code) like ''%TW%'' THEN rs.rate
	ELSE coalesce(df.rate,RS.effective_interest_rate) END AS rate,
    (SELECT Name
     FROM EFL_NEO_CAS_LMS.generic_parameter
     WHERE dtype = ''RepayPolicyRateType''
     AND code = TO_CHAR(rs.RATE_TYPE)
    ) AS Rate_Type,
    SL.Samount_Basevalue AS SANCTION_AMOUNT,
    rs1.TotalInterestAmount,
    SL.Samount_Basevalue + rs1.TotalInterestAmount AS TOTAL_AMT_PAID_BY_BORROWER,
    (SELECT Name
     FROM efl_neo_cas_lms.Generic_Parameter
     WHERE Id = Ld.Loan_Disbursal_Status
    ) AS Loan_Disbursal_Status,
    case  when upper(product_code) like ''%EEF%'' then ''EEF''
      when upper(product_code) like ''%CEF%'' then ''CEF''
      when upper(product_code) like ''%SBF%'' then ''SBF''
      when upper(product_code) like ''%SMF%'' then ''SMF''
      when upper(product_code) like ''%EEL%'' then ''EEL''
      when upper(product_code) like ''%TW%'' then ''TW''
      when upper(product_code) like ''%REF%'' then ''REF''
      when upper(product_code) like ''%CORTRAD1%'' then ''TRADE FINANCE''
      when upper(product_code) like ''%COR%'' then ''CORPORATE FINANCE''
      when upper(product_code) like ''%EMPU1%'' then ''EMPLOYEE''
      when upper(product_code) like ''%FIG%'' then ''FIG''
      when upper(product_code) like ''%JUMBOBT1%'' then ''EEL''
      when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%EEF%'' then ''EEF''
      when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%CEF%'' then ''CEF''
      when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%REF%'' then ''REF''
      when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%EEL%'' then ''EEL''
      when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%SBF%'' then ''SBF''
      when upper(product_code) in (''BLSEC'',''BLUNSEC'') and upper(scheme_code) like ''%BL_CF_SEC%'' then ''CEF''
      when upper(product_code) in (''BLSEC'')           and upper(scheme_code) like ''BL_EMP_SEC'' then ''EMPLOYEE''
   else ''NA'' end as Vertical,rs.MORATORIUM_IN_MONTH
FROM efl_neo_cas_lms.LOAN_APPLICATION A
LEFT JOIN efl_neo_cas_lms.SUB_LOAN SL ON a.id = sl.application_fk
LEFT JOIN efl_neo_cas_lms.PARTY P ON A.ID = P.LOAN_APPLICATION_FK
LEFT JOIN efl_neo_cas_lms.CUSTOMER C ON C.ID = P.CUSTOMER
LEFT JOIN efl_neo_cas_lms.Loan_Disbursal Ld ON Sl.Id = Ld.Subloan_Id
LEFT JOIN EFL_NEO_CAS_LMS.repayment_schedule rs ON sl.repayment_schedule = rs.id
LEFT JOIN efl_neo_cas_lms.loan_product p ON p.Id = Sl.Product
LEFT JOIN efl_neo_cas_lms.Loan_Scheme ls ON ls.Id = Sl.Scheme
left join (
select application_number,
to_number(replace(JSON_VALUE(DATA_JSON_STRING, ''$.irrdetails0[0].roi70''),''%'','''')) as rate
from efl_neo_cas_lms.dynamic_form
where APP_FORM_DATA_MAPS_KEY=''ModelIRR_Form'')df on a.application_number=df.application_number
LEFT JOIN (
   SELECT application_number,
sum("interestAmount") as TotalInterestAmount,FIRST_INSTALLMENT_DATE
  FROM EFL_NEO_CAS_LMS.loan_Application A
LEFT JOIN
(
    select application_fk,repayment_schedule from
    (
    select application_fk,repayment_schedule
        ,row_number()over(partition by application_fk order by repayment_schedule desc)rnk
    from EFL_NEO_CAS_LMS.SUB_LOAN 
    )a
    where rnk=1 
)SL ON a.id = sl.application_fk
LEFT JOIN EFL_NEO_CAS_LMS.repayment_schedule rs ON sl.repayment_schedule = rs.id
,jSON_TABLE(coalesce(CONSOLIDATED_RESPONSE,NATIVE_RESPONSE), ''$.coreRepaymentScheduleDetailDTOList[*]''
    COLUMNS(
    "interestAmount" PATH ''$.interestAmount''
    )) "J"
    group by application_number  ,FIRST_INSTALLMENT_DATE
) rs1 ON a.application_number = rs1.application_number
WHERE p.party_role = 0
AND IS_PARENT_SUB_LOAN = 1
AND a.APPLICATION_NUMBER = ''${applicationNo}''
')`
    
      let applicantDetails = await connection.request()
      .query(applicantQuery);

        if(applicantDetails.recordset[0]){
          const repaymentDetails = new sql.Request();
          repaymentDetails.input('Application_Number', sql.NVarChar(50), applicationNo);
          const applicantRepaymentDetails = await repaymentDetails.execute('SP_Repayment_schedule_KFS');
          
          const feeCharges = new sql.Request();
          feeCharges.input('Application_Number', sql.NVarChar(50), applicationNo);
          const applicantCharges = await feeCharges.execute('SP_Fees_KFS');
          
          const APRParameters = new sql.Request();
          APRParameters.input('Application_Number', sql.NVarChar(50), applicationNo);
          const APR_Parameters = await APRParameters.execute('SP_APR_PARAMETER_KFS');
          
          const installmentDetail = new sql.Request();
          installmentDetail.input('Application_Number', sql.NVarChar(50), applicationNo);
          const installmentDetails = await installmentDetail.execute('SP_Instl_type_KFS');
          
          const structureDetail = new sql.Request();
          structureDetail.input('Application_Number', sql.NVarChar(50), applicationNo);
          const structureDetails = await structureDetail.execute('SP_APR_Instl_Type_KFS');

          

          const specialConditionsQuery = `SELECT *
            FROM OPENQUERY([efldb01_fqdn_ssl], '
                select "Application Number",listagg("Description",'','') as "Description"
                from efl_neo_cas_lms.VW_CR_APP_SPECIAL_COND
                where "Conditions" = ''OPS DISBURSAL''
                and "To Be Met Till Stage" in(''Disbursal'',''Post Disbursal'')
                and "Application Number" = ''${applicationNo}''
				group by "Application Number"
            ')`;
            
          let specialConditions = await connection.request()
          .query(specialConditionsQuery);
          // .input('applicationNo', sql.VarChar, applicationNo) // Define the input parameter

            const KFSResult = {
                applicant: applicantDetails.recordset,
                repaymentDetails: applicantRepaymentDetails.recordset,
                charges: applicantCharges.recordset,
                APR_Parameters : APR_Parameters.recordsets,
                installmentDetails : installmentDetails.recordset,
                specialConditions : specialConditions.recordset,
                structureDetails : structureDetails.recordset
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
    } finally{
      if (connection) {
        // Close the connection to avoid leaks
        await connection.close();
      }
    }
    return result;
  }


 ///generate KFS PDF file

 exports.generateKFSPdf = async(req,res) => {
  
  const pdf = require('html-pdf');
  const templateValues = template[req.params.language];
  const applicationNo = req.params.APPLICATION_NUMBER.trim();
    let KFS_RESULT = '';
    
    KFS_RESULT = await getKFSApplicantSP(applicationNo);
    // KFS_RESULT = await getKFSApplicantQuery(applicationNo);
    // KFS_RESULT = await oracleConnection(applicationNo);
    
    if(KFS_RESULT.isSuccess){
      applicant = KFS_RESULT.result.applicant[0]
      
      repaymentDetails = KFS_RESULT.result.repaymentDetails
      charge = KFS_RESULT.result.charges
      installmentDetails = KFS_RESULT.result.installmentDetails
      structureDetails = KFS_RESULT.result.structureDetails
      
      let Structuredinst2 = structureDetails.map((res) => `${res.INSTALLMENT_NUMBER},${res.INSTALMENT}$`)

      specialConditions = KFS_RESULT.result.specialConditions[0]
      
      apr_Parameters = KFS_RESULT.result.APR_Parameters
      apr = await getApr(apr_Parameters,Structuredinst2)
      let count = 0;

      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      const charges = charge.map((rowdata) => {
        // Create the row structure
        if(rowdata.PAYABLE_TO_RE || rowdata.PAYABLE_TO_THIRD_PARTY){
          count++;
          return `
            <tr>
            <td style="text-align:center;">${toSmallRoman(count)}</td>
            <td colspan="3">${rowdata.CHARGE_NAME ? rowdata.CHARGE_NAME : ""}</td>
            <td style="text-align:center" style="width:12%" >${rowdata.ONE_TIME_RE ? rowdata.ONE_TIME_RE : templateValues[86]}</td>
            <td  class="text-right" style="width:12%">${(rowdata.PAYABLE_TO_RE &&  rowdata.PAYABLE_TO_RE != 0) ? getCurrency(rowdata.PAYABLE_TO_RE) : templateValues[86]}</td>
            <td  style="text-align:center" style="width:12%" >${rowdata.ONE_TIME_THIRD_PARTY ? rowdata.ONE_TIME_THIRD_PARTY : templateValues[86]}</td>
            <td class="text-right" style="width:26%" colspan="3">${(rowdata.PAYABLE_TO_THIRD_PARTY  &&  rowdata.PAYABLE_TO_THIRD_PARTY != 0) ? getCurrency(rowdata.PAYABLE_TO_THIRD_PARTY) : templateValues[86]}</td>
        </tr>
          `;
          
        }
      }).join("");

      
      const installmentDetail = installmentDetails.map((rowdata,index) => {
        let rows = installmentDetails.length
          let i = index + 1;
          return `
            <tr>
          <td colspan="2" >${toSmallRoman(i)}.) ${rowdata.INSTALLMENT_TYPE ? rowdata.INSTALLMENT_TYPE : ""}</td>
          <td colspan="2" style="text-align:center">${rowdata.NUMBER_OF_EPIS ? rowdata.NUMBER_OF_EPIS : ""}</td>
          <td colspan="2" class="text-right">${rowdata.EPI ? getCurrency(rowdata.EPI) : ""}</td>
          ${index == 0 ? '<td colspan="4" rowspan="' + rows +'" class="text-right" valign="top">' + (applicant.FIRST_INSTALLMENT_DATE ? applicant.FIRST_INSTALLMENT_DATE : "") + '</td>' : ""}
      </tr>
          `; 
      }).join("");

      const installmentDetail3rdPage = installmentDetails.map((rowdata,index) => {
        let i = index + 1;
          return `
          <tr>
            <td colspan="3" >${toSmallRoman(i)}.) ${rowdata.INSTALLMENT_TYPE ? rowdata.INSTALLMENT_TYPE : ""}</td>
            <td colspan="4" style="text-align:center">${rowdata.NUMBER_OF_EPIS ? rowdata.NUMBER_OF_EPIS : ""}</td>
            <td colspan="2" class="text-right">${rowdata.EPI ? getCurrency(rowdata.EPI) : ""}</td>
          </tr>
          `; 
      }).join("");

      const repaymentHeader = `
      <table style="border-collapse: collapse;font-size:18px;border: 1px solid black; width: 100%;">
        <tr>
        <td style="width:16%;text-align:center;font-weight:600">${templateValues[80]}</td>
        <td style="width:21%;text-align:center;padding-left:15px;padding-right:15px;font-weight:600">${templateValues[81]}</td>
        <td style="width:21%;text-align:center;font-weight:600">${templateValues[82]}</td>
        <td style="width:21%;text-align:center;font-weight:600">${templateValues[83]}</td>
        <td style="width:21%;text-align:center;font-weight:600">${templateValues[84]}</td>
        </tr>`
      
      const records = repaymentDetails.map((rowdata) => {
          return `<tr>
                    <td style="width:16%;text-align:center">${rowdata.INSTALLMENT_NUMBER}</td>
                    <td style="width:21%;text-align:right;padding-left:15px;padding-right:15px">${getCurrency(rowdata.OPENINGBALANCE)}</td>
                    <td style="width:21%;text-align:right">${getCurrency(rowdata.PRINCIPALAMOUNT)}</td>
                    <td style="width:21%;text-align:right">${getCurrency(rowdata.INTERESTAMOUNT)}</td>
                    <td style="width:21%;text-align:right">${getCurrency(rowdata.INSTALMENT)}</td>
                  </tr>`;
      }).join("");

    const htmlContent = `
<html>
  <head>
    <title>Sample PDF</title>
  </head>
  <body>
    <style>
    html{
    zoom : 0.65;
    }
    @font-face {
  font-family: 'Century Gothic';
  src: url('./assets/font/CenturyGothic.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  }
  *{
   font-family: 'Century Gothic', sans-serif;
   }
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
  .header{
    float: right;
    height: 30px;
    text-align: right;
    font-size: 18px;
    font-weight: 600;
    padding-right: 10px;
    }
      </style>
      <header class="header">
      ${templateValues[93]}
      </header>
    <h1 style="text-align: center;font-size:25px;clear:both">${templateValues[0]}</h1>
    <h1 style="text-align: center;font-size:25px">${templateValues[1]}</h1>
    <table style="border-collapse: collapse;font-size:18px;border: 1px solid black; width: 100%;">
      <tr>
          <td style="width:10%;font-weight:600;text-align:center;">1</td>
          <td colspan="2" style="font-weight:600">${templateValues[2]}</td>
          <td colspan="3" style="text-align:center">${applicant.APPLICATION_NUMBER ? applicant.APPLICATION_NUMBER : ""}</td>
          <td colspan="2" style="font-weight:600">${templateValues[3]}</td>
          <td colspan="2" class="text-right">${applicant.TYPE_OF_LOAN ? applicant.TYPE_OF_LOAN : ""}</td>
      </tr>
      <tr>
          <td style="font-weight:600;text-align:center;">2</td>
          <td colspan="5" style="font-weight:600">${templateValues[4]}</td>
          <td colspan="4" class="text-right"> ${applicant.SANCTION_AMOUNT ? getCurrency(applicant.SANCTION_AMOUNT) : ""}</td>
      </tr>
      <tr>
          <td style="font-weight:600;text-align:center;">3</td>
          <td colspan="5">
          <p style="font-weight:600">${templateValues[5]}</p>
          <p>${templateValues[6]}</p>
          <p>${templateValues[7]}</p>
          </td>
          <td colspan="4">
          ${specialConditions?.Description ? templateValues[107] : templateValues[106]}
          ${specialConditions?.Description ? ' - ' + specialConditions.Description : ""}</td>
      </tr>
      <tr>
          <td style="font-weight:600;text-align:center;">4</td>
          <td colspan="5" style="font-weight:600">${templateValues[9]})</td>
          <td colspan="4" class="text-right">${applicant.TENURE ? applicant.TENURE : 0} ${templateValues[85]}</td>
      </tr>
      <tr>
          <td style="font-weight:600;text-align:center;">5</td>
          <td colspan="9" style="font-weight:600">${templateValues[10]}</td>
      </tr>
      <tr>
          <td style="width:26%;text-align:center" colspan="2">${templateValues[11]}</td>
          <td style="width:17%;text-align:center" colspan="2">${templateValues[12]}</td>
          <td style="width:17%;text-align:center" colspan="2">${templateValues[13]}</td>
          <td style="width:40%" colspan="4" valign="top">${templateValues[14]}</td>
      </tr>
     ${installmentDetail}       
       <tr>
          <td style="font-weight:600;text-align:center;">6</td>
          <td colspan="5" style="font-weight:600">${templateValues[15]}</td>
          <td colspan="4" class="text-right">${applicant.RATE ? applicant.RATE.toFixed(2) + "% | " + applicant.RATE_TYPE : ""}</td>
      </tr>
       <tr>
          <td style="font-weight:600;text-align:center;">7</td>
          <td colspan="9" style="font-weight:600">${templateValues[16]}</td>
      </tr>
       <tr>
          <td  style="width:13%" >${templateValues[17]}</td>
          <td style="width:13%" >${templateValues[18]}</td>
          <td style="width:13%" colspan="2">${templateValues[19]}</td>
          <td style="width:13%" >${templateValues[20]} </br> ${templateValues[21]}</td>
          <td style="width:22%"  colspan="2" >${templateValues[22]}</td>
          <td style="width:26%" valign="top" colspan="3">${templateValues[23]}</td>
      </tr>
      <tr>
          <td colspan="5"></td>
          <td style="text-align:center">${templateValues[25]}</td>
          <td style="text-align:center">${templateValues[26]}</td>
          <td >${templateValues[27]}</td>
          <td colspan="2">${templateValues[28]}</td>
      </tr>
      <tr>
          <td style="text-align:center" style="width:13%">${templateValues[86]}</td>
          <td style="text-align:center" style="width:13%">${templateValues[86]}</td>
          <td style="text-align:center" style="width:13%" colspan="2">${templateValues[86]}</td>
          <td style="text-align:center" style="width:13%">${templateValues[86]}</td>
          <td style="text-align:center" style="width:11%">${templateValues[86]}</td>
          <td style="text-align:center" style="width:11%">${templateValues[86]}</td>
          <td style="text-align:center" style="width:8%">${templateValues[86]}</td>
          <td style="text-align:center" style="width:16%" colspan="2">${templateValues[86]}</td>
      </tr>
      <tr>
          <td style="font-weight:600;text-align:center;">8</td>
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
          <td style="font-weight:600;text-align:center;">9</td>
          <td colspan="4">${templateValues[36]}</td>
          <td class="text-right" colspan="5">${apr} %</td>
      </tr>
      <tr>
      <td style="font-weight:600;text-align:center;">10</td>
      <td colspan="9">${templateValues[37]}</td>
      </tr>
      <tr>
          <td style="text-align:center;">(i)</td>
          <td colspan="5"  valign="center">${templateValues[38]}</td>
          <td colspan="4" style="text-align: justify;">${contingentCharges[applicant.VERTICAL == 'TW' ? 'TW' : applicant.VERTICAL == 'EEL' ? 'EEL' : 'CORE'][req.params.language][0]}</td>
      </tr>
      <tr>
          <td style="text-align:center;">(ii)</td>
          <td colspan="5" valign="top">${templateValues[39]}</td>
          <td colspan="4" style="text-align: left;">${contingentCharges[applicant.VERTICAL == 'TW' ? 'TW' : applicant.VERTICAL == 'EEL' ? 'EEL' : 'CORE'][req.params.language][1]}</td>
      </tr>
      <tr>
          <td style="text-align:center;">(iii)</td>
          <td colspan="5" valign="center">${templateValues[40]}</td>
          <td colspan="4" style="text-align: justify;">${contingentCharges[applicant.VERTICAL == 'TW' ? 'TW' : applicant.VERTICAL == 'EEL' ? 'EEL' : 'CORE'][req.params.language][2]}</td>
      </tr>
      <tr>
          <td style="text-align:center;">(iv)</td>
          <td colspan="5" valign="top">${templateValues[41]}</td>
          <td colspan="4" style="text-align: left;">${contingentCharges[applicant.VERTICAL == 'TW' ? 'TW' : applicant.VERTICAL == 'EEL' ? 'EEL' : 'CORE'][req.params.language][3]}</td>
      </tr>
      <tr >
          <td style="text-align:center;">(v)</td>
          <td colspan="5" valign="top">${templateValues[42]}</td>
          <td colspan="4" style="text-align: left;">${contingentCharges[applicant.VERTICAL == 'TW' ? 'TW' : applicant.VERTICAL == 'EEL' ? 'EEL' : 'CORE'][req.params.language][4]}</td>
      </tr>
      <tr >
          <td style="text-align:center;">(vi)</td>
          <td colspan="5" >${templateValues[97]}</td>
          <td colspan="4" style="text-align: left;">${templateValues[98]} ${applicant.RATE ? applicant.RATE.toFixed(2) : ""} ${templateValues[99]}</td>
      </tr>
      <tr >
          <td style="text-align:center;">(vii)</td>
          <td colspan="5" >${templateValues[100]}</td>
          <td colspan="4" style="text-align: left;">${templateValues[104]}</td>
      </tr>
      <tr >
          <td style="text-align:center;">(viii)</td>
          <td colspan="5" >${templateValues[101]}</td>
          <td colspan="4" style="text-align: left;">${templateValues[104]}</td>
      </tr>
      <tr >
          <td style="text-align:center;">(ix)</td>
          <td colspan="5" >${templateValues[102]}</td>
          <td colspan="4" style="text-align: left;">${templateValues[105]}</td>
      </tr>
      <tr >
          <td style="text-align:center;">(x)</td>
          <td colspan="5" >${templateValues[103]}</td>
          <td colspan="4" style="text-align: left;">${templateValues[105]}</td>
      </tr>
      
    </table>
    <div style="page-break-inside : avoid;height:100px;">
     <div class="header">
      ${templateValues[93]}
      </div>
    <h1 style="text-align: center;font-size:25px;margin-top:100px;margin-bottom:50px;">${templateValues[43]}</h1>
    </div>
    <table style="border-collapse: collapse;font-size:18px;border: 1px solid black; width: 100%;">
      <tr style="height: 50px;">
        <td style="width:5%;text-align:center;">1</td>
        <td style="width:28.33%" colspan="2" >${templateValues[44]}</td>
        <td style="width:66.67%;text-align: justify;" colspan="6">${templateValues[87]}</td>
      </tr>
      <tr style="height: 50px;">
        <td style="text-align:center;">2</td>
        <td colspan="2">${templateValues[45]}</td>
        <td  style="text-align:justify;" colspan="6">${templateValues[88]}</td>
      </tr>
      <tr style="height: 50px;">
        <td style="text-align:center;">3</td>
        <td colspan="2">${templateValues[46]}</td>
        <td colspan="6"  >${templateValues[90]}<br>
        ${templateValues[91]}</td>
      </tr>
      <tr style="height: 50px;">
        <td style="text-align:center;width:5%;">4</td>
        <td colspan="5" style="width:23.33%">${templateValues[47]}</td>
        <td colspan="3" style="width:66.66%;text-align:left;">${templateValues[48]}</td>
      </tr>
      <tr style="height: 50px;">
      <td style="text-align:center;">5</td>
      <td colspan="8">${templateValues[49]}</td>
      </tr>
      <tr style="height: 50px;">
      <td style="width:33.33%" valign="top" colspan="3">${templateValues[50]}</td>
      <td style="width:33.33%" valign="top" colspan="3">${templateValues[51]}</td>
      <td style="width:33.33%" valign="top" colspan="3">${templateValues[52]}</td>
      </tr>
      <tr style="height: 50px;">
      <td style="width:33.33%;text-align:center;" valign="top" colspan="3">${templateValues[86]}</td>
      <td style="width:33.33%;text-align:center;" valign="top" colspan="3">${templateValues[86]}</td>
      <td style="width:33.33%;text-align:center;" valign="top" colspan="3">${templateValues[86]}</td>
      </tr>    
      <tr style="height: 50px;">
      <td style="text-align:center;width:5%;">6</td>
      <td colspan="8">${templateValues[53]}</td>
      </tr>
      <tr style="height: 50px;">
        <td colspan="6" style="padding-left:70px">${templateValues[54]}</td>
        <td colspan="3"  style="text-align:left;">${templateValues[55]}</td>
      </tr>
      <tr style="height: 50px">
        <td colspan="6" style="padding-left:70px">${templateValues[56]}</td>
        <td colspan="3"  style="text-align:left;">${templateValues[92]}<br><a href="https://www.electronicafinance.com/disclosures/">https://www.electronicafin&#8203;ance.com/disclosures/</a></td>
      </tr>
    </table>  
    <div style="page-break-after: always;"></div>
    <div class="header" style="margin-top:100px">
    ${templateValues[94]}
    </div>
    <h1 style="text-align: center;font-size:25px;margin-top:50px;margin-bottom:50px;clear:both">${templateValues[57]}</h1>

    <table style="border-collapse: collapse;font-size:18px;border: 1px solid black; width: 100%;">
    <tr>
      <td style="width:10%;text-align:center;font-weight:600" colspan="1">${templateValues[58]}</td>
      <td style="width:65%;text-align:center;font-weight:600" colspan="6">${templateValues[59]}</td>
      <td style="width:25%;text-align:center;font-weight:600" colspan="2">${templateValues[60]}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">1</td>
      <td style="width:65%" colspan="6">${templateValues[61]}</td>
      <td style="width:25%" class="text-right" colspan="2">${applicant.SANCTION_AMOUNT ? getCurrency(applicant.SANCTION_AMOUNT) : ""}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">2</td>
      <td style="width:65%" colspan="6">${templateValues[62]}</td>
      <td style="width:25%" class="text-right" colspan="2">${applicant.TENURE ? applicant.TENURE : ""} ${templateValues[85]}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">a)</td>
      <td style="width:65%" colspan="6">${templateValues[63]}</td>
      <td style="width:25%" class="text-right" colspan="2">${templateValues[86]}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">b)</td>
      <td style="width:65%" colspan="8">${templateValues[64]}<br>${templateValues[65]}</td>
    </tr>
    <tr>
      <td style="width:56.68%;text-align:center;" colspan="3">${templateValues[11]}</td>
      <td style="width:23.86%;text-align:center;" colspan="4">${templateValues[12]}</td>
      <td style="width:19.46%;text-align:center;" colspan="2">${templateValues[13]}</td>
    </tr>
    ${installmentDetail3rdPage}
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">c)</td>
      <td style="width:65%;" colspan="6">${templateValues[66]}</td>
      <td style="width:25%" class="text-right" colspan="2">${applicant.MORATORIUM_IN_MONTH ? applicant.MORATORIUM_IN_MONTH + ' ' + templateValues[85]: templateValues[86]}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">d)</td>
      <td style="width:65%;" colspan="6">${templateValues[67]}</td>
      <td style="width:25%" class="text-right" colspan="2">${applicant.FIRST_INSTALLMENT_DATE ? applicant.FIRST_INSTALLMENT_DATE : ""}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">3</td>
      <td style="width:65%" colspan="6">${templateValues[68]}</td>
      <td style="width:25%" class="text-right" colspan="2">${applicant.RATE_TYPE ? applicant.RATE_TYPE : ""}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">4</td>
      <td style="width:65%" colspan="6">${templateValues[69]}</td>
      <td style="width:25%" class="text-right" colspan="2">${applicant.RATE ? applicant.RATE.toFixed(2) : ""}%</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1" >5</td>
      <td style="width:65%" colspan="6" >${templateValues[70]}</td>
      <td style="width:25%" class="text-right" colspan="2" >${applicant.TOTALINTERESTAMOUNT ? getCurrency(applicant.TOTALINTERESTAMOUNT) : ""}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" valign:"center" colspan="1">6</td>
      <td style="width:65%" colspan="6">${templateValues[71]}</td>
      <td style="width:25%" class="text-right" colspan="2">${getCurrency(apr_Parameters[1][0].PAYABLE_TO_RE + apr_Parameters[1][0].PAYABLE_TO_THIRD_PARTY)}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">A</td>
      <td style="width:65%" colspan="6">${templateValues[72]}</td>
      <td style="width:25%" class="text-right" colspan="2">${apr_Parameters[1][0].PAYABLE_TO_RE ? getCurrency(apr_Parameters[1][0].PAYABLE_TO_RE) : templateValues[86]}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;"colspan="1">B</td>
      <td style="width:65%"colspan="6">${templateValues[73]}</td>
      <td style="width:25%" class="text-right"colspan="2">${apr_Parameters[1][0].PAYABLE_TO_THIRD_PARTY ? getCurrency(apr_Parameters[1][0].PAYABLE_TO_THIRD_PARTY) : templateValues[86]}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">7</td>
      <td style="width:65%" colspan="6">${templateValues[74]}</td>
      <td style="width:25%" class="text-right" colspan="2">${getCurrency(applicant.SANCTION_AMOUNT - ( apr_Parameters[1][0].PAYABLE_TO_RE + apr_Parameters[1][0].PAYABLE_TO_THIRD_PARTY ))}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">8</td>
      <td style="width:65%" colspan="6">${templateValues[75]}</td>
      <td style="width:25%" class="text-right" colspan="2">${applicant.TOTAL_AMT_PAID_BY_BORROWER ? getCurrency(applicant.TOTAL_AMT_PAID_BY_BORROWER) : ""}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">9</td>
      <td style="width:65%" colspan="6">${templateValues[76]}</td>
      <td style="width:25%" class="text-right" colspan="2">${apr} %</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">10</td>
      <td style="width:65%" colspan="6">${templateValues[77]}</td>
      <td style="width:25%" class="text-right" colspan="2">${specialConditions?.Description ? specialConditions.Description : templateValues[86]}</td>
    </tr>
    <tr>
      <td style="width:10%;text-align:center;" colspan="1">11</td>
      <td style="width:65%" colspan="6">${templateValues[78]}</td>
      <td style="width:25%" class="text-right" colspan="2">${applicant.FIRST_INSTALLMENT_DATE ? applicant.FIRST_INSTALLMENT_DATE : ""}</td>
    </tr>
    <table/>  
    <div style="page-break-after: always;"></div>
    <div class="header" style="margin-top:100px">
    ${templateValues[95]}
    </div>
    <h1 style="text-align: center;font-size:25px;margin-top:50px;clear:both">${templateValues[79]}</h1>
    ${repaymentHeader}
    ${records}

  </body>
    </html>`;


    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    let filePath = path.join(__dirname, '../../assets', `${applicationNo}.pdf`)
    await page.pdf({
      path: filePath, // Save PDF to this path
      format: 'A4',
      printBackground: true,
      margin: {
        top: '75px',
        bottom: '75px',
        left: '100px',
        right: '100px'
      },
    });


    // Close the browser
    await browser.close();
   
    let s3_url = await uploadPDF(filePath);

    
    //store Details
    const saveData = await DownloadKFSDetails.create({
      "application_number" : applicant.APPLICATION_NUMBER ,
      "type_of_loan" : applicant.TYPE_OF_LOAN ,
      "finance_amount" : applicant.FINANCE_AMOUNT ,
      "tenure" : applicant.TENURE ,
      "loan_terms" : applicant.LOAN_TERMS ,
      "first_installment_date" : applicant.FIRST_INSTALLMENT_DATE ,
      "effective_interest_rate" : applicant.EFFECTIVE_INTEREST_RATE ,
      "rate_type" : applicant.RATE_TYPE ,
      "sanction_amount" : applicant.SANCTION_AMOUNT ,
      "total_interest_amount" : applicant.TOTALINTERESTAMOUNT ,
      "toatl_amount_paid_by_borrower" : applicant.TOTAL_AMT_PAID_BY_BORROWER ,
      "loan_disbursal_status" : applicant.LOAN_DISBURSAL_STATUS ,
      "vertical" : applicant.VERTICAL ,
      "moratorium_in_month" : applicant.MORATORIUM_IN_MONTH ,
      "description" : specialConditions ? specialConditions.Description : null,
      "language" : languages[req.params.language],
      // "user_employeeCode" : req.user.employeeCode,
      "user_employeeCode" : '8151',
      "ip_address" : "192.168.1.44",
      "s3_bucket_url" : s3_url,
    })

    // Generate the PDF and save it as 'output.pdf'
   // Send the generated PDF file to the client
   res.setHeader('Content-Type', 'application/pdf');
   res.setHeader('Content-Disposition', `attachment; filename="${applicationNo}_KFS.pdf"`);

   res.sendFile(filePath, (err) => {
     if (err) {
       console.error('Error sending file:', err);
       res.status(500).send('Error sending file');
     } else {
       // Optionally, delete the file after sending it to the client
      //  fs.unlinkSync(filePath);
       fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        } else {
          console.log('File deleted successfully');
        }
      });
     }
   });


  }else{
      res.status(KFS_RESULT.statusCode).send(KFS_RESULT);
  }
}
